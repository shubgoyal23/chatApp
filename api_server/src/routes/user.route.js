import { Router } from "express";

import {
   registerUser,
   loginUser,
   logoutUser,
   currentUser,
   listUsers,
   changeAvatar,
   uploadAvatar,
   editUserDetails,
   forgotPassword,
   checkOtp,
   resetPassword,
   editUserDetailsSendOtp,
   getUserInfo,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);
router.route("/check-otp").post(checkOtp);
router.route("/reset-password").post(resetPassword);


// secure route

router.route("/logout").get(verifyJWT, logoutUser);

router.route("/info").get(verifyJWT,getUserInfo);
router.route("/user").get(verifyJWT, currentUser);
router.route("/user-edit").post(verifyJWT, editUserDetails);
router.route("/user-edit-otp").post(verifyJWT, editUserDetailsSendOtp);

router.route("/list").post(verifyJWT, listUsers);

router.route("/avatar").post(verifyJWT, changeAvatar);
router.route("/avatar-upload").post(
   verifyJWT,
   upload.fields([
      {
         name: "avatar",
         maxCount: 1,
      },
   ]),
   uploadAvatar
);

router.use((err, req, res, next) => {
   if (err instanceof ApiError) {
      res.status(err.statusCode).json({
         success: false,
         message: err.message,
         errors: err.errors,
      });
   } else {
      console.error(err);
      res.status(500).json({
         success: false,
         message: err.message,
      });
   }
});

export default router;
