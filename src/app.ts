import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN!,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// import
import userRouter from "./routes/user/user.route";
import userDetailRouter from "./routes/user/user-detail.route";
import messageRouter from "./routes/messages/message.routes";
import chatRouter from "./routes/chats/chats.routes";
import favouriteRouter from "./routes/messages/favourite.routes";

app.use("/api/v1", userRouter);
app.use("/api/v1", userDetailRouter);
app.use("/api/v1", chatRouter);
app.use("/api/v1", messageRouter);
app.use("/api/v1", favouriteRouter);
export { app };
