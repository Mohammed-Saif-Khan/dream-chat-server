import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { generateAccessAndRefereshTokens, User } from "../models/user.model";
import { generateOTP } from "../utils/constant";
import { sendMail } from "../utils/mail";
import crypto from "crypto";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, password } = req.body;

  if (
    [firstName, lastName, email, phone, password].some(
      (field) => !field?.trim()
    )
  ) {
    return res.status(400).json({ message: "All Field are required" });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    return res
      .status(500)
      .json({ message: "Something went wrong while registering the user" });
  }

  return res
    .status(201)
    .json({ success: true, message: "User Created Successfully" });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => !field?.trim())) {
    return res.status(400).json({ message: "Email and Password is required" });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isPasswordValid = await user?.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid user credentials" });
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user?._id as string
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  user.isVerified = true;
  await user.save();

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      data: loggedInUser,
      accessToken,
      refreshToken,
      message: "User login Successfully",
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  user.isVerified = false;
  await user.save();

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({ message: "User logged Out", data: {} });
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Email is not found" });
    }

    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    const resetToken = user.generateResetPasswordToken();
    await user.save();

    const setOtp = await User.findByIdAndUpdate(user?._id, {
      $set: {
        otp: {
          code: otp,
          expiresAt: new Date(otpExpiry),
        },
      },
    });

    if (!setOtp) {
      return res.status(500).json({ message: "OTP is not sent!" });
    }

    try {
      await sendMail(email, otp);
    } catch (error) {
      // If email sending fails, clean up token and OTP
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.otp = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: "OTP was not sent", error });
    }

    return res.status(200).json({ data: resetToken, message: "OTP is sent" });
  }
);

export const otp = asyncHandler(async (req: Request, res: Response) => {
  const { otp, token } = req.body;

  if ([otp, token].some((field) => !field?.trim())) {
    return res.status(400).json({ message: "All Fields are required" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired rest token" });
  }

  const currentTimestamp = Date.now();

  const isOtpValid =
    user.otp.code === otp && currentTimestamp < user.otp.expiresAt.getTime();

  if (!isOtpValid) {
    return res.status(404).json({ message: "Invalid OTP" });
  }

  user.otp = undefined;
  await user.save();

  return res.status(200).json({ message: "OTP is verified" });
});

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token is invalid or has expired" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.otp = undefined;

    await user.save();

    return res.status(200).json({ message: "Password Reset Successfully" });
  }
);

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
