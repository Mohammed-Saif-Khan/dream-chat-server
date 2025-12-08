import mongoose, { Document } from "mongoose";

export interface ChatDocuments extends Document {
  participants: mongoose.Schema.Types.ObjectId[];
  message: mongoose.Schema.Types.ObjectId[];
  unreadMessage: number;
}
