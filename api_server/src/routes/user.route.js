import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import {
   listTestUsers,
   registerUser,
   verifyEmail,
   resendVerification,
   loginUser,
   refreshAccessToken,
   logoutUser,
   currentUser,
   listUsers,
   changeAvatar,
   uploadAvatar,
   cleanupUpload,
   editUserDetails,
   forgotPassword,
   checkOtp,
   resetPassword,
   editUserDetailsSendOtp,
   getUserInfo,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

const limiter = (limit, windowMinutes = 15) =>
   rateLimit({
      windowMs: windowMinutes * 60 * 1000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
         success: false,
         message: "Too many attempts. Please wait a few minutes and try again.",
      },
   });

// brute-force protection for credentials and one-time codes
const authLimiter = limiter(20);
// these send emails, so keep them tight
const emailLimiter = limiter(5);

router.route("/test-users").get(limiter(60), listTestUsers);
router.route("/register").post(emailLimiter, registerUser);
router.route("/verify-email").post(authLimiter, verifyEmail);
router.route("/resend-verification").post(emailLimiter, resendVerification);
router.route("/login").post(authLimiter, loginUser);
router.route("/refresh-token").post(limiter(60), refreshAccessToken);
router.route("/forgot-password").post(emailLimiter, forgotPassword);
router.route("/check-otp").post(authLimiter, checkOtp);
router.route("/reset-password").post(authLimiter, resetPassword);

// secure route

router.route("/logout").post(verifyJWT, logoutUser);
// kept for older clients
router.route("/logout").get(verifyJWT, logoutUser);

router.route("/info").get(verifyJWT, getUserInfo);
router.route("/user").get(verifyJWT, currentUser);
router.route("/user-edit").post(verifyJWT, authLimiter, editUserDetails);
router.route("/user-edit-otp").post(verifyJWT, emailLimiter, editUserDetailsSendOtp);

router.route("/list").post(verifyJWT, listUsers);

router.route("/avatar").post(verifyJWT, changeAvatar);
router.route("/avatar-upload").post(
   verifyJWT,
   limiter(10),
   cleanupUpload,
   upload.fields([
      {
         name: "avatar",
         maxCount: 1,
      },
   ]),
   uploadAvatar
);

export default router;
