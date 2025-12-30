import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware";
import {
  favouriteMessage,
  getFavouriteMessage,
} from "../../controller/messages/favourite.message.controller";

const router = Router();

router.use(verifyJWT);

router.route("/favourite/:messageId").put(favouriteMessage);
router.route("/favourite/:chatId").get(getFavouriteMessage);

export default router;
