import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { Message } from "../../models/messages/message.model";
import { Favourite } from "../../models/messages/favourite-message";
import mongoose from "mongoose";

export const favouriteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    let favourite = await Favourite.findOne({ user: userId });

    if (!favourite) {
      favourite = await Favourite.create({
        user: userId,
        favouriteMessage: [messageId],
      });

      return res.status(200).json({
        favourite,
        message: "Message added to favourites",
        isFavourite: true,
      });
    }

    const isAlreadyFavourite = favourite.favouriteMessage.includes(
      new mongoose.Types.ObjectId(messageId)
    );

    if (isAlreadyFavourite) {
      favourite = await Favourite.findOneAndUpdate(
        { user: userId },
        { $pull: { favouriteMessage: messageId } },
        { new: true }
      );

      return res.status(200).json({
        favourite,
        message: "Message removed from favourites",
        isFavourite: false,
      });
    }

    favourite = await Favourite.findOneAndUpdate(
      { user: userId },
      {
        $push: {
          favouriteMessage: {
            $each: [messageId],
            $position: 0,
          },
        },
      },
      { new: true }
    );

    return res.status(200).json({
      favourite,
      message: "Message added to favourites",
      isFavourite: true,
    });
  }
);
