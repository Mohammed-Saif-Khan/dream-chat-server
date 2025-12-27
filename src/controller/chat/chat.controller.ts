import { Request, Response } from "express";
import { Chat } from "../../models/chat/chat.model";
import { Favourite } from "../../models/messages/favourite-message";
import { asyncHandler } from "../../utils/asyncHandler";

export const getChat = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?._id;
  const { receiverId } = req.params;

  if (!senderId || !receiverId) {
    return res
      .status(400)
      .json({ message: "SenderId and ReceiverId are required" });
  }

  const favouriteDoc = await Favourite.findOne({ user: senderId });

  const favouriteIds = favouriteDoc
    ? favouriteDoc?.favouriteMessage?.map((id) => id.toString())
    : [];

  const chat = await Chat.findOne({
    participants: { $all: [receiverId, senderId], $size: 2 },
  }).populate({
    path: "message",
    populate: {
      path: "senderId",
      select: "_id firstName lastName",
    },
  });

  if (!chat) {
    return res
      .status(404)
      .json({ success: false, message: "Chat is not found" });
  }

  const chatWithFavouriteFlag = {
    ...chat.toObject(),
    message: chat.message.map((msg: any) => ({
      ...msg.toObject(),
      isFavorite: favouriteIds.includes(msg._id.toString()),
    })),
  };

  return res.status(200).json({
    success: true,
    data: chatWithFavouriteFlag,
    message: "Chat fetched successfully",
  });
});

export const getChatList = asyncHandler(async (req, res) => {
  const senderId = req.user?._id;

  if (!senderId) {
    return res.status(400).json({ message: "Sender Id is required" });
  }

  const chatlist = await Chat.aggregate([
    { $match: { participants: senderId } },
    {
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participants",
        pipeline: [
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
            },
          },
          {
            $lookup: {
              from: "userdetails",
              localField: "_id",
              foreignField: "user",
              as: "details",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              avatar: { $arrayElemAt: ["$details.avatar", 0] },
            },
          },
          {
            $project: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        participants: {
          $filter: {
            input: "$participants",
            as: "p",
            cond: { $ne: ["$$p._id", senderId] },
          },
        },
      },
    },
    {
      $addFields: {
        participants: { $arrayElemAt: ["$participants", 0] },
      },
    },
    {
      $lookup: {
        from: "messages",
        localField: "message",
        foreignField: "_id",
        as: "messageArr",
        pipeline: [
          {
            $match: {
              status: "delivered",
              isDeleted: false,
              receiverId: senderId,
            },
          },
          { $group: { _id: "$status", unreadCount: { $sum: 1 } } },
        ],
      },
    },
    {
      $addFields: {
        unreadCount: { $arrayElemAt: ["$messageArr.unreadCount", 0] },
      },
    },
    { $project: { messageArr: 0 } },
    {
      $lookup: {
        from: "messages",
        localField: "message",
        foreignField: "_id",
        as: "lastMessage",
        pipeline: [
          {
            $match: {
              deletedAt: null,
            },
          },
          {
            $project: {
              _id: 1,
              message: 1,
              time: 1,
              status: 1,
              createdAt: 1,
              isDeleted: 1,
              deletedAt: 1,
              senderId: 1,
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
      },
    },
    {
      $addFields: {
        lastMessage: { $arrayElemAt: ["$lastMessage", 0] },
      },
    },
    { $project: { message: 0 } },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  res.status(200).json({ success: true, chatlist });
});
