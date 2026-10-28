import crypto from "node:crypto";
import fs from "node:fs/promises";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
   deleteCloudinaryImage,
   uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { sendEmail } from "../utils/sendEmail.js";
import forgotPasswordEmailTemplate from "../utils/EmailTemplate/forgotPassword.js";
import VerificationEmailTemplate from "../utils/EmailTemplate/verifyAccount.js";
import { Verify } from "../models/verification.model.js";
import { Group } from "../models/group.model.js";
import jwt from "jsonwebtoken";
import { TEST_USERS, testUsersEnabled } from "../utils/testUsers.js";
import {
   escapeRegex,
   identifierQuery,
   objectId,
   str,
} from "../utils/validate.js";

const PUBLIC_FIELDS = "username email fullname _id avatar about";
const OTP_TTL_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const DAY = 24 * 60 * 60 * 1000;

const cookieOptions = (maxAge) => ({
   httpOnly: true,
   secure: process.env.COOKIE_SECURE !== "false",
   sameSite: process.env.COOKIE_SAMESITE || "none",
   domain: process.env.COOKIE_DOMAIN || undefined,
   path: "/",
   maxAge,
});

const publicUser = (user) => ({
   _id: user._id,
   username: user.username,
   email: user.email,
   fullname: user.fullname,
   avatar: user.avatar,
   about: user.about,
});

// Issues a fresh access/refresh token pair and sets both as http-only cookies.
const startSession = async (res, user) => {
   const accessToken = user.generateAccessToken();
   const refreshToken = user.generateRefreshToken();
   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });

   res.cookie("accessToken", accessToken, cookieOptions(7 * DAY));
   res.cookie("refreshToken", refreshToken, cookieOptions(10 * DAY));
};

const clearSession = (res) => {
   const { maxAge, ...options } = cookieOptions(0);
   res.clearCookie("accessToken", options);
   res.clearCookie("refreshToken", options);
};

function generateOTP(length = 6) {
   let otp = "";
   for (let i = 0; i < length; i++) {
      otp += crypto.randomInt(0, 10).toString();
   }
   return otp;
}

const hashOtp = (otp) =>
   crypto.createHash("sha256").update(String(otp)).digest("hex");

// Stores a new OTP (replacing any previous one for the same purpose); only its
// hash is kept so a database leak does not expose live codes.
const issueOtp = async (userId, otpFor) => {
   const otp = generateOTP();
   await Verify.findOneAndUpdate(
      { userId, otpFor },
      {
         otp: hashOtp(otp),
         otpExpiry: new Date(Date.now() + OTP_TTL_MS),
         attempts: 0,
      },
      { upsert: true }
   );
   return otp;
};

// Checks an OTP, counting failed attempts. With consume, a valid OTP is deleted.
const verifyOTP = async (userId, otpFor, otp, { consume = true } = {}) => {
   const code = str(otp, { max: 10 });
   if (!/^\d{6}$/.test(code)) {
      throw new ApiError(400, "Enter the 6-digit code");
   }
   const record = await Verify.findOne({ userId, otpFor });
   if (!record || (record.otpExpiry && record.otpExpiry < new Date())) {
      throw new ApiError(400, "Code expired or not requested. Request a new one.");
   }
   if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await Verify.deleteOne({ _id: record._id });
      throw new ApiError(429, "Too many attempts. Request a new code.");
   }
   const expected = Buffer.from(record.otp ?? "");
   const given = Buffer.from(hashOtp(code));
   if (
      expected.length !== given.length ||
      !crypto.timingSafeEqual(expected, given)
   ) {
      await Verify.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      throw new ApiError(400, "Invalid code");
   }
   if (consume) {
      await Verify.deleteOne({ _id: record._id });
   }
   return true;
};

const sendVerificationEmail = async (user, otp, subject = "Verify Your Email") =>
   sendEmail({
      priority: "transactional",
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      html: VerificationEmailTemplate({
         fullname: user.fullname,
         email: user.email,
         username: user.username,
         otp,
      }),
   });

const registerUser = asyncHandler(async (req, res) => {
   const fullname = str(req.body?.fullname, { max: 50 });
   const username = str(req.body?.username, { max: 16 });
   const email = str(req.body?.email, { max: 100 }).toLowerCase();
   const password = str(req.body?.password, { max: 128, trim: false });

   if (!fullname || !username || !email || !password) {
      throw new ApiError(400, "All fields are required");
   }

   const existing = await User.find({ $or: [{ username }, { email }] });
   for (const u of existing) {
      if (u.verified) {
         throw new ApiError(
            409,
            u.email === email
               ? "An account with this email already exists"
               : "Username is already taken, try another one"
         );
      }
      if (u.email !== email) {
         throw new ApiError(409, "Username is already taken, try another one");
      }
      // an unverified account never proved it owns this email; whoever
      // verifies it now takes it over
      await User.deleteOne({ _id: u._id });
      await Verify.deleteMany({ userId: u._id });
   }

   const user = await User.create({
      fullname,
      username,
      password,
      email,
      accountType: "user",
   });

   const otp = await issueOtp(user._id, "registration");
   await sendVerificationEmail(user, otp);

   return res
      .status(201)
      .json(
         new ApiResponse(
            201,
            { username: user.username, email: user.email },
            "Account created. Check your email for the verification code."
         )
      );
});

// Confirms the registration OTP, marks the account verified and logs it in.
const verifyEmail = asyncHandler(async (req, res) => {
   const user = await User.findOne(identifierQuery(req.body));
   if (!user) {
      throw new ApiError(400, "Invalid code");
   }
   if (!user.verified) {
      await verifyOTP(user._id, "registration", req.body?.otp);
      user.verified = true;
   }
   await startSession(res, user);
   return res
      .status(200)
      .json(new ApiResponse(200, { user: publicUser(user) }, "Email verified"));
});

const resendVerification = asyncHandler(async (req, res) => {
   const user = await User.findOne(identifierQuery(req.body));
   // same answer either way, so this cannot be used to probe for accounts
   if (user && !user.verified) {
      const otp = await issueOtp(user._id, "registration");
      await sendVerificationEmail(user, otp);
   }
   return res
      .status(200)
      .json(new ApiResponse(200, {}, "If the account exists, a new code was sent"));
});

const loginUser = asyncHandler(async (req, res) => {
   const query = identifierQuery(req.body);
   const password = str(req.body?.password, { max: 128, trim: false });
   if (!password) {
      throw new ApiError(400, "Password is required");
   }

   const user = await User.findOne(query);
   // one message for both cases so attackers cannot enumerate accounts
   if (!user || !(await user.isPasswordCorrect(password))) {
      throw new ApiError(401, "Invalid username/email or password");
   }

   if (!user.verified) {
      const otp = await issueOtp(user._id, "registration");
      await sendVerificationEmail(user, otp);
      throw new ApiError(
         403,
         "Please verify your email. We sent you a new code.",
         [{ needsVerification: true, email: user.email, username: user.username }]
      );
   }

   await startSession(res, user);

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            { user: publicUser(user) },
            "User logged In Successfully"
         )
      );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
   const token = req.cookies?.refreshToken;
   if (!token) {
      throw new ApiError(401, "Not authorised");
   }
   let decoded;
   try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
         algorithms: ["HS256"],
      });
   } catch {
      clearSession(res);
      throw new ApiError(401, "Session expired, please log in again");
   }
   const user = await User.findById(decoded?._id);
   if (!user || !user.refreshToken || user.refreshToken !== token) {
      clearSession(res);
      throw new ApiError(401, "Session expired, please log in again");
   }
   await startSession(res, user);
   return res
      .status(200)
      .json(new ApiResponse(200, { user: publicUser(user) }, "Session refreshed"));
});

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 },
   });
   clearSession(res);
   res.status(200).json(new ApiResponse(200, {}, "User logged out Successfully"));
});

const currentUser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(new ApiResponse(200, publicUser(req.user), "User fetched successfully"));
});

const getUserInfo = asyncHandler(async (req, res) => {
   const id = objectId(req.query.id);
   const user = await User.findById(id).select("username fullname _id avatar about");
   if (user) {
      return res
         .status(200)
         .json(new ApiResponse(200, user, "User fetched successfully"));
   }
   // group details are only visible to members
   const group = await Group.findOne({ _id: id, members: req.user._id }).populate(
      "members",
      "username fullname _id avatar"
   );
   if (!group) {
      throw new ApiError(404, "User not found");
   }
   return res
      .status(200)
      .json(new ApiResponse(200, group, "Group fetched successfully"));
});

const listUsers = asyncHandler(async (req, res) => {
   const search = str(req.body?.fullname, { max: 50 });
   if (!search) {
      throw new ApiError(400, "Search text is required");
   }
   const pattern = { $regex: escapeRegex(search), $options: "i" };
   const userslist = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ fullname: pattern }, { username: pattern }],
   })
      .sort({ fullname: 1 })
      .limit(25)
      .select("username fullname _id avatar about");

   res.status(200).json(
      new ApiResponse(200, userslist, "user list found successfully")
   );
});

const isUploadedAvatar = (avatar) =>
   typeof avatar === "string" && avatar.startsWith("chat-profile/");

const uploadAvatar = asyncHandler(async (req, res) => {
   const localPath = req.files?.avatar?.[0]?.path;
   if (!localPath) {
      throw new ApiError(400, "Avatar file is required");
   }

   const avatar = await uploadOnCloudinary(localPath);
   if (!avatar) {
      throw new ApiError(502, "Avatar upload failed, try again");
   }

   const previous = req.user.avatar;
   const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatar.public_id },
      { new: true }
   ).select(PUBLIC_FIELDS);

   if (isUploadedAvatar(previous) && previous !== avatar.public_id) {
      await deleteCloudinaryImage(previous);
   }
   return res
      .status(200)
      .json(new ApiResponse(200, user, "avatar change successfully"));
});

const changeAvatar = asyncHandler(async (req, res) => {
   const avatar = str(req.body?.avatar, { max: 64 });
   // only the built-in avatars may be picked; uploaded ones go through
   // uploadAvatar, so nobody can point at (and later delete) another's photo
   if (!/^chat\/[a-z0-9]{8,32}$/.test(avatar)) {
      throw new ApiError(400, "Invalid avatar");
   }
   const previous = req.user.avatar;
   const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
   ).select(PUBLIC_FIELDS);

   if (isUploadedAvatar(previous)) {
      await deleteCloudinaryImage(previous);
   }
   return res
      .status(200)
      .json(new ApiResponse(200, user, "avatar change successfully"));
});

const editUserDetails = asyncHandler(async (req, res) => {
   const updates = {};
   const fullname = str(req.body?.fullname, { max: 50 });
   const about = req.body?.about !== undefined ? str(req.body.about, { max: 200 }) : undefined;
   const username = str(req.body?.username, { max: 16 });
   const email = str(req.body?.email, { max: 100 }).toLowerCase();

   if (fullname && fullname !== req.user.fullname) updates.fullname = fullname;
   if (about !== undefined && about !== (req.user.about ?? "")) updates.about = about;
   if (username && username !== req.user.username) updates.username = username;
   if (email && email !== req.user.email) updates.email = email;

   if (Object.keys(updates).length === 0) {
      return res
         .status(200)
         .json(new ApiResponse(200, publicUser(req.user), "Nothing to update"));
   }

   // changing how you log in requires the code sent to your current email
   if (updates.username || updates.email) {
      await verifyOTP(req.user._id, "updateDetails", req.body?.otp);
   }

   const updateuser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
   ).select(PUBLIC_FIELDS);

   return res
      .status(200)
      .json(
         new ApiResponse(200, updateuser, "Account details updated successfully")
      );
});

const editUserDetailsSendOtp = asyncHandler(async (req, res) => {
   const otp = await issueOtp(req.user._id, "updateDetails");
   await sendVerificationEmail(req.user, otp, "Confirm your account changes");
   return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
   const user = await User.findOne(identifierQuery(req.body));
   if (user && !user.isTestUser) {
      const otp = await issueOtp(user._id, "forgetPassword");
      await sendEmail({
         priority: "transactional",
         from: process.env.EMAIL_FROM,
         to: user.email,
         subject: "Password Recovery Mail",
         html: forgotPasswordEmailTemplate({
            fullname: user.fullname,
            email: user.email,
            otp,
         }),
      });
   }
   // same response whether or not the account exists
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            {},
            "If the account exists, a reset code was sent to its email"
         )
      );
});

const checkOtp = asyncHandler(async (req, res) => {
   const otpFor = str(req.body?.otpFor, { max: 20 });
   if (otpFor !== "forgetPassword") {
      throw new ApiError(400, "Invalid request");
   }
   const user = await User.findOne(identifierQuery(req.body));
   if (!user) {
      throw new ApiError(400, "Invalid code");
   }
   // only peeks: the code is consumed by resetPassword
   await verifyOTP(user._id, otpFor, req.body?.otp, { consume: false });

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "OTP is successfully Verified"));
});

const resetPassword = asyncHandler(async (req, res) => {
   const password = str(req.body?.password, { max: 128, trim: false });
   if (!password) {
      throw new ApiError(400, "New password is required");
   }
   const user = await User.findOne(identifierQuery(req.body));
   if (!user) {
      throw new ApiError(400, "Invalid code");
   }
   if (user.isTestUser) {
      throw new ApiError(403, "Test accounts can't be changed");
   }
   await verifyOTP(user._id, "forgetPassword", req.body?.otp);

   user.password = password;
   // a reset proves email ownership, and logs out every existing session
   user.verified = true;
   user.refreshToken = undefined;
   user.tokensValidAfter = new Date();
   await user.save({ validateBeforeSave: true });

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Reset successfully"));
});

// Lists the shared test accounts for the login page (404 when disabled).
const listTestUsers = asyncHandler(async (req, res) => {
   if (!testUsersEnabled()) {
      throw new ApiError(404, "Not found");
   }
   const users = await User.find({
      isTestUser: true,
      username: { $in: TEST_USERS.map((t) => t.username) },
   }).select("username fullname avatar about");
   return res.status(200).json(new ApiResponse(200, users, "Test users"));
});

// One-click sign-in for a test account; never works for real accounts.
const testLogin = asyncHandler(async (req, res) => {
   if (!testUsersEnabled()) {
      throw new ApiError(404, "Not found");
   }
   const username = str(req.body?.username, { max: 16 });
   const user = await User.findOne({ username, isTestUser: true });
   if (!user) {
      throw new ApiError(404, "Test user not found");
   }
   await startSession(res, user);
   return res
      .status(200)
      .json(new ApiResponse(200, { user: publicUser(user) }, "Signed in as test user"));
});

// Test accounts are shared by everyone, so nobody may change them.
const blockTestUsers = (req, res, next) => {
   if (req.user?.isTestUser) {
      return next(new ApiError(403, "Test accounts can't be changed. Create your own account to edit a profile."));
   }
   next();
};

// removes multer's temp file whatever happened during the upload
const cleanupUpload = (req, res, next) => {
   res.on("finish", () => {
      const p = req.files?.avatar?.[0]?.path;
      if (p) fs.unlink(p).catch(() => {});
   });
   next();
};

export {
   listTestUsers,
   testLogin,
   blockTestUsers,
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
};
