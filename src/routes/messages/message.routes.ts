import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware";
import { sendMessage } from "../../controller/messages/message.controller";

const router = Router();

router.use(verifyJWT);

router.route("/message").post(sendMessage);

export default router;
