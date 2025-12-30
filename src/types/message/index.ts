import { Document, Types } from "mongoose";

export interface MessageDocuments extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  replyTo: Types.ObjectId;
  message: string;
  time: string;
  status: string;
  isDeleted: boolean;
  deletedAt: Date;
  isFavorite: boolean;
}

export interface FavouriteMessage extends Document {
  user: Types.ObjectId;
  chat: Types.ObjectId;
  message: Types.ObjectId;
}
