import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware";
import { getChat, getChatList } from "../../controller/chat/chat.controller";

const router = Router();

router.use(verifyJWT);

router.route("/chat/all-chats").get(getChatList);
router.route("/chat/:receiverId").get(getChat);

export default router;
