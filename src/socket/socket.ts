import { Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";
import { Message } from "../models/messages/message.model";

export let io: IOServer;

export const webSocket = (server: HttpServer) => {
  io = new IOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN!,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);

    socket.on("join-room", async (userId) => {
      socket.join(userId);
      console.log("User joined:", userId);

      // 🔹 When user comes online, mark all "sent" messages as "delivered"
      const undeliveredMessages = await Message.find({
        receiverId: userId,
        status: "sent",
      }).select("_id");

      await Message.updateMany(
        { receiverId: userId, status: "sent" },
        { $set: { status: "delivered" } }
      );

      const messageIds = undeliveredMessages.map((m) => m._id.toString());
      io.to(userId).emit("message-delivered", messageIds);
    });

    socket.on("typing", ({ receiverId, senderId }) => {
      io.to(receiverId).emit("user-typing", { senderId });
    });

    socket.on("stop-typing", ({ receiverId, senderId }) => {
      io.to(receiverId).emit("user-stop-typing", { senderId });
    });

    socket.on("message-read", async ({ senderId, messageId }) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          status: "read",
        });
        io.to(senderId).emit("message-read", {
          messageIds: [messageId],
        });
      } catch (error) {
        console.log("Error updating read status:", error);
      }
    });
  });
};
