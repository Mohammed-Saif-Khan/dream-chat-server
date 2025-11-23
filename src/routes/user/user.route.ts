import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  otp,
  resetPassword,
  signup,
} from "../../controller/user/user.controller";
import { verifyJWT } from "../../middleware/auth.middleware";

const router = Router();

router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(verifyJWT, logout);
router.route("/forgot-password").post(forgotPassword);
router.route("/otp").post(otp);
router.route("/reset-password").post(resetPassword);

export default router;
