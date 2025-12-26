import mongoose, { Schema } from "mongoose";
import { FavouriteMessage } from "../../types/message";

const favouriteMessage = new Schema<FavouriteMessage>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    favouriteMessage: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "message",
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

export const Favourite = mongoose.model<FavouriteMessage>(
  "favourite",
  favouriteMessage
);
