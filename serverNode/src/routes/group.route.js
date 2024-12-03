import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { CreateGroup } from "../controllers/group.controller.js";

const router = Router();

// router.route("/new").post(verifyJWT, newMessage);
router.route("/new").post(verifyJWT, CreateGroup);
router.route("/delete").post(verifyJWT, CreateGroup);
router.route("/add/member").post(verifyJWT, CreateGroup);
router.route("/add/admin").post(verifyJWT, CreateGroup);
router.route("/remove/member").post(verifyJWT, CreateGroup);
router.route("/remove/admin").post(verifyJWT, CreateGroup);

export default router;