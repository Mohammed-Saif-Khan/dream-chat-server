import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { Chat } from "../../models/chat/chat.model";

export const getChat = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?._id;
  const { receiverId } = req.params;

  if (!senderId || !receiverId) {
    return res
      .status(400)
      .json({ message: "SenderId and ReceiverId are required" });
  }

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

  return res
    .status(200)
    .json({ success: true, data: chat, message: "Chat fetched successfully" });
});
