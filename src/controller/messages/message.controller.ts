import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { Message } from "../../models/messages/message.model";
import { Chat } from "../../models/chat/chat.model";
import { ObjectId } from "mongoose";
import { io } from "../../socket/socket";

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?._id;
  const { receiverId, message } = req.body;

  if (!receiverId || !message) {
    return res.status(404).json({ message: "All fields are required" });
  }

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

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

  io.to(receiverId).emit("receiver-message", newMessage);

  return res
    .status(200)
    .json({ success: true, data: newMessage, message: "Message Sent" });
});
