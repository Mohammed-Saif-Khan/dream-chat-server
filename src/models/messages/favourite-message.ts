import mongoose, { Schema } from "mongoose";
import { FavouriteMessage } from "../../types/message";

const favouriteMessage = new Schema<FavouriteMessage>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chat",
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

export const Favourite = mongoose.model<FavouriteMessage>(
  "favourite",
  favouriteMessage
);
