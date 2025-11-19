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

    if (!req.file) {
      return res.status(400).json({ message: "No avatar provided" });
    }

    const buffer = req.file.buffer;

    // Old avatar delete
    let profile = await UserDetail.findOne({ user: userId });
    if (profile?.avatar) await deleteFromCloudinary(profile.avatar);

    // Upload new avatar
    const uploaded: { secure_url?: string } = await uploadOnCloudinary(
      buffer,
      "dream-chat/profile"
    );

    if (!uploaded?.secure_url) {
      return res.status(500).json({ message: "Failed to upload avatar" });
    }

    // Save new avatar in DB
    profile = await UserDetail.findOneAndUpdate(
      { user: userId },
      { $set: { avatar: uploaded?.secure_url } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Avatar updated successfully",
      avatar: uploaded?.secure_url,
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

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(404).json({ message: "User ID not found" });
  }

  const allUsers = await UserDetail.find({ user: { $ne: userId } }).populate(
    "user",
    "_id firstName lastName phone email"
  );

  return res
    .status(200)
    .json({ allUsers, message: "User data fetched Successfully" });
});

export const getUserDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id;

    if (!userId) {
      return res.status(404).json({ message: "User ID not found" });
    }

    const userDetail = await UserDetail.findOne({ user: userId })
      .select("-_id -createdAt -updatedAt -user")
      .populate({
        path: "user",
        select: "firstName lastName email phone createdAt -_id",
      });

    if (!userDetail) {
      return res.status(404).json({ message: "User Detail not found" });
    }

    return res.status(200).json({
      userDetail,
      message: "User Detail Fetched Successfully",
      success: true,
    });
  }
);
