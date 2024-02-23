import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allMessage, newMessage, userContacts } from "../controllers/message.controllers.js";

const router = Router();

router.route("/new").post(verifyJWT, newMessage);
router.route("/all").post(verifyJWT, allMessage);
router.route("/contacts").post(verifyJWT, userContacts);


export default router;