import { Router } from "express";
import { verifyJWT } from "../../middleware/auth.middleware";
import { favouriteMessage } from "../../controller/messages/favourite.message.controller";

const router = Router();

router.use(verifyJWT);

router.route("/favourite/:messageId").put(favouriteMessage);

export default router;
