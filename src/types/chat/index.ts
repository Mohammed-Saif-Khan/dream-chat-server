import { Document, Types } from "mongoose";

export interface ChatDocuments extends Document {
  participants: Types.ObjectId[];
  message: Types.ObjectId[];
  unreadMessage: number;
}
