
import { inngest } from "../client";
import axios from "axios";
import connectDb from "@/config/database";
import Video from "@/models/Video";
interface RenderVideoEvent {
  data: {
    script: string;
    videoId: string;
  };
}

export const renderVideo = inngest.createFunction(
    { id: "render-video" },
  { event: "video/render.requested" },
  async ({ event, step }: { event: RenderVideoEvent; step: any }) => {
    const { script, videoId } = event.data;

    
    // 1. Call Flask to render video
    const res = await step.run("Render with Manim", async () => {
      const response = await axios.post("http://127.0.0.1:5000/render-video", {
        script: script,
        filename: "Video",
      }, {
          headers: {
            'Content-Type': 'application/json',
          }});

      return response.data;
    });
    console.log(res);
    // 2. Update DB
    await connectDb();
    
    if (res?.success && res.video_filename) {
      const publicUrl = res.public_url;
      
      await Video.findByIdAndUpdate(videoId, {
        videoUrl: publicUrl,
        status:"success"
      });
      
    } else {
      await Video.findByIdAndUpdate(videoId, {
        videoUrl: "",
        status:"failed"
      });
      throw new Error("Video rendering failed");
    }

    return { status: "done" };
  }
);