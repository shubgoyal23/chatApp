import { Router } from "express";

import {
   registerUser,
   loginUser,
   logoutUser,
   currentUser,
   listUsers,
   changeAvatar,
   uploadAvatar,
   editUserDetails
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

// secure route

router.route("/logout").get(verifyJWT, logoutUser);

router.route("/user").get(verifyJWT, currentUser);
router.route("/user-edit").post(verifyJWT, editUserDetails);

router.route("/list").post(verifyJWT, listUsers);

router.route("/avatar").post(verifyJWT, changeAvatar);
router.route("/avatar-upload").post(verifyJWT, upload.fields([
   {
       name: "avatar",
       maxCount: 1
   }, 
  
]), uploadAvatar);


export default router;
