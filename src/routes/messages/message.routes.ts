import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware";
import {
  deleteMessage,
  readMessage,
  sendMessage,
} from "../../controller/messages/message.controller";

const router = Router();

router.use(verifyJWT);

router.route("/message").post(sendMessage);
router.route("/message-read").post(readMessage);
router.route("/message/:messageId").delete(deleteMessage);

export default router;
