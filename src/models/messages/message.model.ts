import mongoose, { Schema } from "mongoose";
import { MessageDocuments } from "../../types/message";

const messageSchema = new Schema<MessageDocuments>(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    message: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read"],
      default: "sent",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

export const Message = mongoose.model<MessageDocuments>(
  "message",
  messageSchema
);
