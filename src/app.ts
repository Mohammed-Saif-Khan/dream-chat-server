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
import userRouter from "./routes/user.route";
import userDetailRouter from "./routes/user-detail.route";

app.use("/api/v1", userRouter);
app.use("/api/v1", userDetailRouter);

export { app };
