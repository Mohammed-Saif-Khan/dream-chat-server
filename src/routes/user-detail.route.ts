import { Router } from "express";
import {
  accountProfile,
  getProfile,
  getUserDetails,
  getUsers,
  updatePassword,
  uploadAvatar,
} from "../controller/user-detail.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/profile").post(accountProfile);
router.route("/avatar").post(upload.single("avatar"), uploadAvatar);
router.route("/profile").get(getProfile);
router.route("/update-password").post(updatePassword);
router.route("/users").get(getUsers);
router.route("/users/:id").get(getUserDetails);

export default router;
