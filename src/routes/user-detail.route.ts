import { Router } from "express";
import {
  accountProfile,
  getProfile,
} from "../controller/user-detail.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";

const router = Router();

router.use(verifyJWT);

router.route("/account").post(upload.single("avatar"), accountProfile);
router.route("/profile").get(getProfile);

export default router;
