import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import Video from '../../../models/Video'
import User from '../../../models/User'
import connectDb from "@/config/database";
import { inngest } from "@/inngest/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// --- ROBUST SYSTEM PROMPT FOR SCIENCE & ALGORITHMS ---
const MANIM_SYSTEM_PROMPT = `
You are an expert Python Manim animation developer. 

### CRITICAL SYNTAX RULES:
1.  **NO LATEX:** Use 'Text()' for all text. Do not use MathTex, Tex, or $.
2.  **ATTRIBUTES:** Use 'opacity' (not 'fill_opacity') inside set_fill().
3.  **ARRAYS:** Use VGroup of Squares. Index access: \`squares[i]\`.
4.  **GRAPHS:** Use \`Graph\` class. Access nodes: \`g.vertices[id]\`.
    * **BANNED:** \`labels=True\` (This causes a LaTeX crash).
    * **REQUIRED:** Create a label dictionary: \`labels = {i: Text(str(i)) for i in vertices}\`.
    * Tree Layout Config: Use \`root_vertex\`, NOT \`root\`. Example: \`layout_config={"root_vertex": 1}\`.
    * Ensure ALL vertices in 'edges' exist in 'vertices' list.

### GOLD STANDARD LIBRARY (Copy these patterns exactly):

#### 1. ARRAYS & POINTERS (CS)
\`\`\`python
values = [10, 20, 30]
squares = VGroup(*[Square(side_length=1) for _ in values]).arrange(RIGHT, buff=0)
labels = VGroup(*[Text(str(v)) for v in values])
for l, s in zip(labels, squares): l.move_to(s.get_center())
array_group = VGroup(squares, labels).move_to(ORIGIN)
self.play(Create(array_group))
arrow = Arrow(start=UP, end=DOWN).next_to(squares[0], UP)
self.play(Create(arrow))
\`\`\`

#### 2. TREES & GRAPHS (CS)
\`\`\`python
vertices = [1, 2, 3]
edges = [(1, 2), (1, 3)]
g = Graph(vertices, edges, layout="tree", layout_config={"root": 1}, labels=True)
self.play(Create(g))
self.play(g.vertices[1].animate.set_color(RED))
\`\`\`

#### 3. PHYSICS: ELECTRIC CURRENT (Circuits)
\`\`\`python
# Pattern: Move a Dot (Electron) along a path (Circuit)
circuit = Rectangle(height=4, width=6, color=WHITE)
battery = VGroup(Line(UP, DOWN), Line(UP*0.5, DOWN*0.5).shift(RIGHT*0.2)).move_to(circuit.get_bottom())
electron = Dot(color=YELLOW, radius=0.2)
self.play(Create(circuit), Create(battery))
self.play(MoveAlongPath(electron, circuit), run_time=4, rate_func=linear)
\`\`\`

#### 4. PHYSICS: MAGNETIC/FORCE FIELDS
\`\`\`python
# Pattern: Grid of Arrows
arrows = VGroup()
for x in range(-4, 5, 2):
    for y in range(-3, 4, 2):
        # Create arrow pointing right (simple field) or towards center
        arr = Arrow(start=LEFT, end=RIGHT, buff=0).move_to([x, y, 0]).scale(0.5)
        arrows.add(arr)
self.play(Create(arrows))
# Animate field changing direction
self.play(arrows.animate.rotate(PI/2))
\`\`\`

#### 5. CHEMISTRY: MOLECULES & REACTIONS
\`\`\`python
# Pattern: Circles as Atoms, Lines as Bonds
atom_h1 = Circle(radius=0.4).set_fill(WHITE, opacity=0.8).move_to(LEFT)
atom_h2 = Circle(radius=0.4).set_fill(WHITE, opacity=0.8).move_to(RIGHT)
atom_o = Circle(radius=0.6).set_fill(RED, opacity=0.8).move_to(UP*2)

# Animate Collision/Bonding
self.play(
    atom_h1.animate.move_to(atom_o.get_center() + DL*0.8),
    atom_h2.animate.move_to(atom_o.get_center() + DR*0.8)
)
bond1 = Line(atom_o.get_center(), atom_h1.get_center())
bond2 = Line(atom_o.get_center(), atom_h2.get_center())
self.play(Create(bond1), Create(bond2))
\`\`\`

#### 6. BIOLOGY: CELL DIVISION / MITOSIS
\`\`\`python
# Pattern: Splitting a Circle
cell = Circle(radius=2, color=GREEN).set_fill(GREEN, opacity=0.3)
nucleus = Circle(radius=0.5, color=BLACK).set_fill(BLACK, opacity=0.5)
initial_group = VGroup(cell, nucleus)
self.play(Create(initial_group))

# Split animation (Visual trick: Transform into two circles)
cell_left = Circle(radius=1.5, color=GREEN).set_fill(GREEN, opacity=0.3).shift(LEFT*2)
cell_right = Circle(radius=1.5, color=GREEN).set_fill(GREEN, opacity=0.3).shift(RIGHT*2)
self.play(Transform(initial_group, VGroup(cell_left, cell_right)))
\`\`\`

### OUTPUT FORMAT:
Return ONLY the raw Python code.
`;

// --- AUTO-CORRECTION ENGINE ---
function fixManimScript(script: string): string {
    let fixed = script;
    fixed = fixed.replace(/```python/g, '').replace(/```/g, '').trim();
    if (!fixed.includes('from manim import')) {
        fixed = `from manim import *\n\n${fixed}`;
    }
     fixed = fixed
        .replace(/fill_opacity\s*=/g, 'opacity=')
        .replace(/ShowCreation\(/g, 'Create(')
        .replace(/TextMobject\(/g, 'Text(') 
        .replace(/MathTex\(/g, 'Text(')
        .replace(/Tex\(/g, 'Text(') 
        .replace(/'root'\s*:/g, "'root_vertex':")
        .replace(/"root"\s*:/g, '"root_vertex":')
        .replace(/labels=True/g, 'labels=False') 
        .replace(/DecimalNumber\(/g, 'Text(str(') 
        .replace(/labels\s*=\s*True/g, 'labels=False');
        
    return fixed;
}

export async function POST(request: NextRequest) {
    console.log("Manim API Request")
    try {
        const info = await request.json()
        const msg = info.msg;
        const history = info.history;
        const user = info.user; 
        
        if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 400 })
        if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'API key not found' }, { status: 400 })

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' })
        
        const chatHistory = [
            {
                role: 'user',
                parts: [{ text: MANIM_SYSTEM_PROMPT }]
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I will use these Gold Standard patterns for CS, Physics (circuits/fields), and Chemistry (atoms/bonds).' }]
            }
        ]

        if (history && history.length > 0) {
            const formattedHistory = history.map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
            chatHistory.push(...formattedHistory)
        }

        const chat = await model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 8000,
                temperature: 0.2, 
                topP: 0.8,
                topK: 40,
            }
        })

        const enhancedPrompt = `
        Generate a robust Manim script for: "${msg}".
        
        Requirements:
        1. Class Name: GenScene
        2. Identify the domain (CS, Physics, Chemistry, etc.).
        3. **USE THE GOLD STANDARD PATTERN** corresponding to that domain.
        4. Keep animations simple and step-by-step.
        `;

        const result = await chat.sendMessage(enhancedPrompt)
        const response = await result.response
        const rawText = response.text()

        const cleanScript = fixManimScript(rawText);
        
        await connectDb()
        const userEmail = user?.emailAddresses?.[0]?.emailAddress;
        
        if(!userEmail){
            return NextResponse.json({ success:false, message:"No user email found"}, { status: 401 })
        }
        
        const dbUser = await User.findOne({email: userEmail})
        
        const newVideo = await Video.create({
            userId: dbUser?._id,
            prompt: msg,
            videoUrl: "",
            status: "pending"
        })

        try {
            await inngest.send({
                name: "video/render.requested",
                data: {
                    script: cleanScript,
                    videoId: newVideo._id.toString(),
                },
            });
            
            return NextResponse.json({ 
                success: true,
                message: 'Video Generation Started',
                videoId: newVideo._id 
            })

        } catch (error) {
            console.error("INNGEST ERROR:", error);
            await Video.findByIdAndUpdate(newVideo._id, { status : "failed" })
            return NextResponse.json({ error: 'Failed to queue video generation' }, { status: 500 })
        }
        
    } catch (e) {
        console.error("Error caught:", e)
        return NextResponse.json({ error: 'Failed to generate Manim script' }, { status: 500 })
    }
}