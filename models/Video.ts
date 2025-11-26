import mongoose, { Schema, model, models } from "mongoose";

const VideoSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      default: "",
    },
    // THIS WAS THE CAUSE OF THE ERROR
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"], 
      default: "pending",
    },
    script: {
      type: String,
    },
  },
  { timestamps: true }
);

const Video = models.Video || model("Video", VideoSchema);

export default Video;