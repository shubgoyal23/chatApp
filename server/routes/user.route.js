import { Router } from "express";

import {
   registerUser,
   loginUser,
   logoutUser,
   currentUser,
   listUsers,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secure route

router.route("/logout").get(verifyJWT, logoutUser);
router.route("/user").get(verifyJWT, currentUser);
router.route("/list").post(verifyJWT, listUsers);

export default router;