import dotenv from "dotenv";
import { app } from "./app";
import connectDB from "./db";
import { createServer } from "http";
import { webSocket } from "./socket/socket";

dotenv.config({
  path: "./.env",
});

const httpServer = createServer(app);
webSocket(httpServer);

connectDB()
  .then(() => {
    httpServer.listen(process.env.PORT! || 8000, () => {
      console.log(`⚙️  Server is running at port : ${process.env.PORT!}`);
    });
  })
  .catch((error) => {
    console.log("MONGO db connection failed !!! ", error);
  });
