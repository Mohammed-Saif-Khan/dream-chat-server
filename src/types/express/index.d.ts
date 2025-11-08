import { ObjectId } from "mongoose";
import { User } from "../../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: typeof User.prototype & { _id: ObjectId };
    }
  }
}
