import { Request, Response } from "express";
import { UserDetail } from "../models/user-detail.model";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { IUser, IUserDetail } from "../types/user/user";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudnary";

export const accountProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const body = req.body;
    const userId = req.user?._id;

    const existingProfile = await UserDetail.findOne({ user: userId });

    let userProfile: IUserDetail | null = null;

    if (existingProfile) {
      userProfile = await UserDetail.findByIdAndUpdate(
        existingProfile._id,
        { $set: { ...body } },
        { new: true }
      );
    } else {
      userProfile = await UserDetail.create({
        user: userId,
        ...body,
      });
    }

    let updatedUser: IUser = null;

    if (body.firstName || body.lastName) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            ...(body.firstName && { firstName: body.firstName }),
            ...(body.lastName && { lastName: body.lastName }),
          },
        },
        { new: true, validateBeforeSave: false }
      ).select("-password -refreshToken");
    }

    // Merge both objects into a single one
    const mergedData = {
      ...(userProfile?.toObject?.() || userProfile),
      ...(updatedUser?.toObject?.() || updatedUser),
    };

    return res.status(200).json({
      success: true,
      data: mergedData,
      message: existingProfile
        ? "User Profile Updated Successfully"
        : "User Profile Created Successfully",
    });
  }
);

export const uploadAvatar = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;

    // 1) Avatar file aaya ya nahi
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      return res.status(400).json({ message: "No avatar provided" });
    }

    // 2) User ka profile find karo
    let profile = await UserDetail.findOne({ user: userId });

    // 3) Purana avatar delete karo (agar exist karta hai)
    if (profile?.avatar) {
      await deleteFromCloudinary(profile.avatar);
    }

    // 4) New avatar Cloudinary pe upload karo
    const uploaded = await uploadOnCloudinary(
      avatarLocalPath,
      "dream-chat/profile"
    );
    if (!uploaded?.url) {
      return res.status(500).json({ message: "Failed to upload new avatar" });
    }

    // 5) Upsert (create if not exist, update if exist)
    profile = await UserDetail.findOneAndUpdate(
      { user: userId },
      { $set: { avatar: uploaded.url } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Avatar updated successfully",
      avatar: uploaded.url,
      profile,
    });
  }
);

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req?.user?._id;

  if (!userId) {
    return res.status(400).json({ message: "User ID missing" });
  }

  // Fetch profile with populated user
  const profile = await UserDetail.findOne({ user: userId })
    .populate(
      "user",
      "-password -refreshToken -resetPasswordToken -resetPasswordExpire -otp"
    )
    .lean();

  // If profile doesn't exist → return only user
  if (!profile) {
    const user = await User.findById(userId)
      .select(
        "-password -refreshToken -resetPasswordExpire -resetPasswordToken -provider -otp"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        ...user,
      },
      hasProfile: false,
      message: "User data fetched successfully (no profile found)",
    });
  }

  const finalUser = {
    ...profile.user, // user base fields
    ...profile, // profile fields
  };

  delete finalUser.user; // remove nested user object

  return res.status(200).json({
    user: finalUser,
    hasProfile: true,
    message: "Profile fetched successfully",
  });
});

export const updatePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?._id;

    if ([oldPassword, newPassword].some((field) => field?.trim() === "")) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!userId) {
      return res.status(404).json({ message: "User Id not found" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User is not found" });
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Old password is wrong" });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({ message: "Password Update Successfully" });
  }
);
