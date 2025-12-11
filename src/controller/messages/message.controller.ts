import { Request, Response } from "express";
import { ObjectId } from "mongoose";
import { Chat } from "../../models/chat/chat.model";
import { Message } from "../../models/messages/message.model";
import { asyncHandler } from "../../utils/asyncHandler";
import { io } from "../../socket/socket";
import { UserDetail } from "../../models/user/user-detail.model";

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const senderId = req.user?._id;
  const { receiverId, message, time } = req.body;

  if (!receiverId || !message || !time) {
    return res.status(404).json({ message: "All fields are required" });
  }

  let status: "sent" | "delivered" = "sent";

  try {
    // Check if receiver is online (room exists)
    const room = io.sockets.adapter.rooms.get(receiverId);
    // If user is online mark delivered
    const isReceiverOnline = !!room && room.size > 0;
    if (isReceiverOnline) {
      status = "delivered";
    }
  } catch (error) {
    console.error("Error checking receiver online:", error);
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    message,
    time,
    status,
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

  await newMessage.populate([
    {
      path: "senderId",
      select: "_id firstName lastName",
    },
    {
      path: "receiverId",
      select: "_id firstName lastName",
    },
  ]);

  const userDetail = await UserDetail.findOne({
    user: senderId,
  }).select("avatar");

  const receiverDetail = await UserDetail.findOne({
    user: receiverId,
  }).select("avatar");

  const payload = {
    ...newMessage.toObject(),
    avatar: userDetail?.avatar || null,
    receiverAvtar: receiverDetail?.avatar || null,
    chatId: chat?._id,
  };

  io.to(receiverId).emit("receiver-message", payload);

  return res
    .status(200)
    .json({ success: true, data: payload, message: "Message Sent" });
});

export const readMessage = asyncHandler(async (req: Request, res: Response) => {
  const readerId = req.user?._id;
  const { senderId } = req.body;

  if (!senderId) {
    return res.status(400).json({ message: "Sender Id is required" });
  }

  const unreadMessage = await Message.find({
    senderId,
    receiverId: readerId,
    status: "delivered",
  });

  if (unreadMessage?.length === 0) {
    return res.status(200).json({ message: "No unread messages" });
  }

  await Message.updateMany(
    {
      senderId,
      receiverId: readerId,
      status: "delivered",
    },
    { $set: { status: "read" } }
  );

  const messageIds = unreadMessage?.map((msg) => msg?._id.toString());

  io.to(senderId).emit("message-read", { messageIds });

  return res.status(200).json({
    success: true,
    ids: messageIds,
    message: "Message marked as read",
  });
});

export const deleteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({ message: "Message ID is required" });
    }

    const messageIds = messageId.includes(",")
      ? messageId.split(",")
      : [messageId];

    const messages = await Message.find({ _id: { $in: messageIds } });

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: "Message not found" });
    }

    // FIRST DELETE → messages not deleted yet
    const firstDeleteIds = messages
      .filter((m) => !m.isDeleted)
      .map((m) => m._id);

    if (firstDeleteIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: firstDeleteIds } },
        { $set: { isDeleted: true } }
      );

      return res.status(200).json({
        success: true,
        message: "Message deleted (first delete)",
        userId,
        isDeleted: true,
        deletedIds: firstDeleteIds,
      });
    }

    // SECOND DELETE → deleted but no deletedAt
    const secondDeleteIds = messages
      .filter((m) => m.isDeleted && !m.deletedAt)
      .map((m) => m._id);

    if (secondDeleteIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: secondDeleteIds } },
        { $set: { deletedAt: new Date() } }
      );

      return res.status(200).json({
        success: true,
        message: "Message deleted (second delete)",
        userId,
        deletedAt: new Date(),
        deletedIds: secondDeleteIds,
      });
    }
  }
);
