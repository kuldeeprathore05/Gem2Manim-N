import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/config/database";
import Video from "@/models/Video";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDb();
    const { id } =await params;

    const deleted = await Video.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Video deleted" });
  } catch (error) {
    console.error("Delete video error:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
