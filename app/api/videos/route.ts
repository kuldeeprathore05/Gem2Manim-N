import { NextRequest,NextResponse } from "next/server";
import connectDb from '../../../config/database'
import Video from "@/models/Video";
import User from "@/models/User";
export async function POST(req:NextRequest){
    const user =await req.json();

    const email = user.emailAddresses[0].emailAddress!;
    if(!email){
        return NextResponse.json({
            success:false, 
            message:"No user email found"
        })
    }
    await connectDb()
    const usser = await User.findOne({email});
    // Fetch videos filtered by user's email
    const videos = await Video.find({ 
      userId: usser?._id 
    }).sort({ 
      createdAt: -1 // Most recent first
    })

    return NextResponse.json({
      success: true,
      videos: videos
    })
}