import { NextRequest, NextResponse } from "next/server";
import connectDb from "../../../config/database";
import User from "../../../models/User";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body || !body.user) {
    return NextResponse.json({ success: false, message: "No user provided" });
  }
  //console.log(body)

  const user = body.user;
  const email = user.emailAddresses?.[0]?.emailAddress;

  console.log(email)
  console.log(user.firstName)

  console.log(user.fullName)

  if (!email) {
    return NextResponse.json({ success: false, message: "No email provided" });
  }

  try {
    await connectDb();

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("User already exists:", existing);
      return NextResponse.json({ success: true, message: "User already exists" });
    }

    const newUser = await User.create({
      email,
      firstName: user.firstName || "",
      fullName: user.fullName || "",
    });

    console.log("User created successfully:", newUser);

    return NextResponse.json({ success: true, message: "User created", user: newUser });
  } catch (err) {
    console.error("Error during user creation:", err);
    return NextResponse.json({ success: false, message: "Failed to create user" });
  }
}
