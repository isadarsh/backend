import mongoose, { Schema } from "mongoose";

const videoSchema = new Scehma(
    {
      
  },
  {
    timestamps: true
  }
);

export const Video = mongoose.model("Video", videoSchema);
