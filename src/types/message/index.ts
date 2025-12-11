import { Document, Types } from "mongoose";

export interface MessageDocuments extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
  time: string;
  status: string;
  isDeleted: boolean;
  deletedAt: Date;
}
