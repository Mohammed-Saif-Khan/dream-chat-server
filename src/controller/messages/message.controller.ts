import { Request, Response } from "express";
import { ObjectId } from "mongoose";
import { Chat } from "../../models/chat/chat.model";
import { Message } from "../../models/messages/message.model";
import { asyncHandler } from "../../utils/asyncHandler";

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?._id;
  const { receiverId, message, time } = req.body;

  if (!receiverId || !message || !time) {
    return res.status(404).json({ message: "All fields are required" });
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    message,
    time,
  });

  let chat = await Chat.findOne({
    participants: { $all: [senderId, receiverId], $size: 2 },
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [senderId, receiverId],
      message: [newMessage?._id],
    });
  } else {
    chat.message.push(newMessage?._id as ObjectId);
    await chat.save();
  }

  await newMessage.populate({
    path: "senderId",
    select: "firstName lastName",
  });

  return res
    .status(200)
    .json({ success: true, data: newMessage, message: "Message Sent" });
});
