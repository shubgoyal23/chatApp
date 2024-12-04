import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { AddAdmin, AddMembers, CreateGroup, DeleteGroup, removeAdmin, RemoveMembers } from "../controllers/group.controller.js";

const router = Router();

// router.route("/new").post(verifyJWT, newMessage);
router.route("/new").post(verifyJWT, CreateGroup);
router.route("/delete").post(verifyJWT, DeleteGroup);
router.route("/add/member").post(verifyJWT, AddMembers);
router.route("/add/admin").post(verifyJWT, AddAdmin);
router.route("/remove/member").post(verifyJWT, RemoveMembers);
router.route("/remove/admin").post(verifyJWT, removeAdmin);

export default router;