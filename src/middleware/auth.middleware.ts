import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { User } from "../models/user/user.model";

export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next) => {
    try {
      const token =
        req.cookies.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({ message: "Unauthorized request" });
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as JwtPayload;

      const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        return res.status(401).json({ message: "Invalid Access Token" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.log(error, "Invalid access token");
      return res.status(401).json({ message: "Invalid access token" });
    }
  }
);
