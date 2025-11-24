import { Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";

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

    socket.on("join-room", (userId) => {
      socket.join(userId);
      console.log("User joined:", userId);
    });

    socket.on("typing", ({ receiverId, senderId }) => {
      io.to(receiverId).emit("user-typing", { senderId });
    });

    socket.on("stop-typing", ({ receiverId, senderId }) => {
      io.to(receiverId).emit("user-stop-typing", { senderId });
    });

    socket.on("sending-message", (data) => {
      const { receiverId } = data;
      io.to(receiverId).emit("receiver-message", data);
    });

    socket.on("sending-message-edit-id", ({ tempId, originalMessage }) => {
      const { receiverId } = originalMessage;
      io.to(receiverId).emit("receiver-message-edit-id", {
        tempId,
        originalMessage,
      });
    });
  });
};
