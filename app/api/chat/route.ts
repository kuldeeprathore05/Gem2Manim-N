import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MANIM_SYSTEM_PROMPT = `
You are a Manim script generator. Your task is to create complete, working Manim Python scripts that visualize programming concepts, algorithms, and data structures.

IMPORTANT RULES:
1. Return ONLY the Python Manim script code, no explanations or markdown
2. Always use proper Manim syntax and imports
3. Create a class that inherits from Scene
4. Use clear, educational animations with step-by-step visualization
5. Include text explanations in the animation
6. Use appropriate colors and positioning
7. Make animations smooth and educational
8. Always end with self.wait() for proper video rendering
9. Each element should appear one at a time.
10. Remove previous elements using FadeOut() or ReplacementTransform() before showing the next.
11. Ensure the screen is not cluttered — no overlapping text or shapes.
12. Use AnimationGroup and lag_ratio for multiple element animations.
13. The script should be compatible with Manim Community Edition v0.19.0.
14. Do NOT use MathTex or Tex. Only use Text(...) for text objects. Do not require LaTeX.
15. Never use MathTex or Tex. Use only Text(...). Do not use LaTeX.
16.  Never use DecimalNumber. Use Text(str(number)) or Text(...) for labels.
17.  When creating number lines or axes, use .label_constructor = lambda val: Text(str(val), font_size=24)
18. Ensure the entire script works without any LaTeX installed. Render environments do not support LaTeX.

Example structure:
from manim import *

class ConceptName(Scene):
    def construct(self):
        # Your animation code here
        self.wait()

Focus on creating clear, educational visualizations that help understand the concept being explained.
`;

export async function POST(request: NextRequest) {
    console.log("Manim API Request")
    try {
        const { msg, history } = await request.json()
        console.log("User message:", msg)
        
        if (!msg) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 400 }
            )
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'API key not found' },
                { status: 400 }
            )
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' })
        
        // Prepare chat history with system prompt
        const chatHistory = [
            {
                role: 'user',
                parts: [{ text: MANIM_SYSTEM_PROMPT }]
            },
            {
                role: 'model',
                parts: [{ text: 'I understand. I will generate only Manim Python scripts for educational visualizations. Please provide the concept you want me to visualize.' }]
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
                maxOutputTokens: 2000,
                temperature: 0.3, 
                topP: 0.8,
                topK: 40,
            }
        })

        
        const enhancedPrompt = `Generate a complete Manim script to visualize: ${msg}

Requirements:
- Create a working Python class that inherits from Scene
- Use proper Manim imports and syntax
- Include step-by-step animation with explanations
- Use appropriate colors and positioning
- Make it educational and clear
- Return ONLY the Python code, no markdown or explanations
- Replace all MathTex(...) calls with Text(...).
- get_edge_center(direction) returns a 3D coordinate (numpy.ndarray) on the edge of the object in the specified direction.
- "Generate a valid Manim script compatible with Manim version 0.19.0. Avoid using unsupported keyword arguments like time_width, num_corners, or experimental features. The script should work with standard classes like Scene, Text, Circle, Square, AnimationGroup, FadeIn, Transform, etc. Ensure no errors during rendering."
Topic: ${msg}`

        const result = await chat.sendMessage(enhancedPrompt)
        const response = await result.response
        let text = response.text()

        text = text.replace(/```python\n?/g, '').replace(/```\n?/g, '')
        text = text.trim()
        console.log(text)
        if (!text.includes('from manim import')) {
            text = `from manim import *\n\n${text}`
        }
       

        // Forward request to Flask backend
        const res  = await axios.post('https://gem2manim-f.onrender.com/render-video', {
        script: text,
        filename: "Video"
        });
        let data = res.data;
        console.log(data);
        if(!data.success) {
            return NextResponse.json({
                success:false, 
                url:null,
                message:"Manim Didn't respond"
            })
        }  
        console.log(1)
        console.log(data.video_filename)
        const resp = await axios.get(`https://gem2manim-f.onrender.com/video/${data.video_filename}`)
        let dataa = resp.data;
        console.log(dataa)
        if(!dataa.success) {
            return NextResponse.json({
                success:false, 
                url : null,
                message:"SupaBase Didn't respond"
            })
        }  

        return NextResponse.json({ 
            success:true,
            url:dataa.url,
            message: 'Here is your video'
        })
        
    } catch (e) {
        console.error("Error caught", e)
        return NextResponse.json(
            { error: 'Failed to generate Manim script' },
            { status: 500 }
        )
    }
}