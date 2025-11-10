import { Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  otp: { code: string; expiresAt: Date };
  password: string;
  provider: string;
  refreshToken: string;
  isVerified: boolean;
  resetPasswordToken: string;
  resetPasswordExpire: Date;
  isPasswordCorrect: (password: string) => Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generateResetPasswordToken(): string;
}

export interface IUserDetail extends Document {
  user: IUser;
  avatar: string;
  gender: "male" | "female";
  dob: Date;
  country: string;
  about: string;
  facebook: string;
  instagram: string;
  x: string;
  linkedin: string;
  youtube: string;
  other: string;
}
