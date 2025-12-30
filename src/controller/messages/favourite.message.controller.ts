import { Request, Response } from "express";
import { Favourite } from "../../models/messages/favourite-message";
import { asyncHandler } from "../../utils/asyncHandler";

export const favouriteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { messageId } = req.params;
    const { chatId } = req.body;

    if (!chatId || !messageId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Favourite.findOne({
      user: userId,
      chat: chatId,
      message: messageId,
    });

    if (existing) {
      await Favourite.deleteOne({ _id: existing?._id });
      return res.status(200).json({
        success: true,
        message: "Remove as Favourite",
      });
    } else {
      const favourite = await Favourite.create({
        user: userId,
        chat: chatId,
        message: messageId,
      });
      return res
        .status(200)
        .json({ success: true, data: favourite, message: "Mark as Favourite" });
    }
  }
);

export const getFavouriteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "Chat Id is not found!" });
    }

    const favourite = await Favourite.find({
      user: userId,
      chat: chatId,
    }).populate({
      path: "message",
      select: "-isFavorite -isDeleted -deletedAt",
      populate: [
        {
          path: "senderId",
          select: "_id firstName lastName",
          populate: {
            path: "profile",
            model: "userDetail",
            select: "avatar -_id -user",
          },
        },
        {
          path: "receiverId",
          select: "_id firstName lastName",
          populate: {
            path: "profile",
            model: "userDetail",
            select: "avatar -_id -user",
          },
        },
        {
          path: "replyTo",
          select: "_id message senderId",
          populate: {
            path: "senderId",
            select: "firstName lastName",
          },
        },
      ],
    });

    return res
      .status(200)
      .json({ data: favourite, message: "Favourite Fetched Successfully" });
  }
);
