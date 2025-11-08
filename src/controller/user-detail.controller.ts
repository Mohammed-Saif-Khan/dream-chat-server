import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudnary";
import { User } from "../models/user.model";
import { UserDetail } from "../models/user-detail.model";

export const accountProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      gender,
      dob,
      country,
      about,
      facebook,
      google,
      x,
      linkedin,
      youtube,
      other,
    } = req.body;

    const file = req.file;
    const avatarLocalPath = file?.path;

    let avatar: string | undefined;

    if (avatarLocalPath) {
      const uploadedAvatar = await uploadOnCloudinary(
        avatarLocalPath,
        "dream-chat/profile"
      );
      avatar = uploadedAvatar?.url;
    }

    const userId = req.user?._id;

    const user = await UserDetail.create({
      user: userId,
      avatar,
      gender,
      dob,
      country,
      about,
      facebook,
      google,
      x,
      linkedin,
      youtube,
      other,
    });

    const createdUserDetail = await User.findById(user?._id);

    if (!createdUserDetail) {
      return res
        .status(500)
        .json({ message: "Something went wrong while create Account info" });
    }

    return res
      .status(201)
      .json({ success: true, message: "User Detail Create" });
  }
);

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req?.user?._id;

  if (!userId) {
    return res.status(400).json({ message: "User ID missing" });
  }

  const userProfile = await UserDetail.findOne({ user: userId })
    .populate("user", "-password -refreshToken")
    .lean();

  if (!userProfile) {
    const user = await User.findById(userId).select(
      "-password -refreshToken -resetPasswordExpire -resetPasswordToken -provider -otp"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user,
      hasProfile: false,
      message: "User data fetched successfully (no profile found)",
    });
  }

  return res.status(200).json({
    data: {
      userProfile,
      hasProfile: true,
    },
    message: "Profile fetched successfully",
  });
});
