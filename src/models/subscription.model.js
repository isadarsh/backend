import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //one who is subscribing
      ref: "User",
    },

    channel: {
      type: Schema.Types.ObjectId, //subscribed to channel
      ref: "Video",
    },
  },
  {
    timestamps: true,
  }
);

export const subscription = mongoose.model("Subscription", subscriptionSchema);
