import mongoose, { Model, Schema } from "mongoose";
import { IUserDetail } from "../types/user/user";

export const userDetailSchema = new Schema<IUserDetail>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    dob: {
      type: Date,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    about: {
      type: String,
      required: false,
    },
    facebook: {
      type: String,
      required: false,
    },
    instagram: {
      type: String,
      required: false,
    },
    x: {
      type: String,
      required: false,
    },
    linkedin: {
      type: String,
      required: false,
    },
    youtube: {
      type: String,
      required: false,
    },
    other: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, versionKey: false }
);

export const UserDetail: Model<IUserDetail> = mongoose.model(
  "userDetail",
  userDetailSchema
);
