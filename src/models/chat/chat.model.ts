import mongoose, { Schema } from "mongoose";
import { ChatDocuments } from "../../types/chat";

const chatSchema = new Schema<ChatDocuments>(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    message: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
      },
    ],
  },
  { timestamps: true }
);

export const Chat = mongoose.model<ChatDocuments>("chat", chatSchema);
