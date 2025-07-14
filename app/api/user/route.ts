import { NextRequest, NextResponse } from "next/server";
import connectDb from '../../../config/database'
import User from '../../../models/User'
export async function POST(request:NextRequest){
    const body = await request.json();
    console.log("Received body:", body);
    const user = body.user;
    if (!user) {
        return NextResponse.json({
            success:false,
        })
    }
    await connectDb();

    const existing = await User.findOne({email:user.emailAddresses[0].emailAddress});
    if(existing){
        return NextResponse.json({
            success:true,
        })
    }
    const newUser = User.create({
        email:user.emailAddresses[0].emailAddress || '',
        firstName:user.firstName || '',
        fullName:user.fullName||'',
    })


    return NextResponse.json({
        success:true,
    })
}