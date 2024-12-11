import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
   deleteCloudinaryImage,
   uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { transporter } from "../utils/transporter.js";
import forgotPasswordEmailTemplate from "../utils/EmailTemplate/forgotPassword.js";
import VerificationEmailTemplate from "../utils/EmailTemplate/verifyAccount.js";
import { Verify } from "../models/verification.model.js";

const generateAccessAndRefereshTokens = async function (userid) {
   try {
      const user = await User.findById(userid);
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
   } catch (error) {
      throw new ApiError(
         500,
         "Something went wrong while generating referesh and access token"
      );
   }
};

const registerUser = asyncHandler(async (req, res) => {
   const { fullname, username, email, password } = req.body;

   if (
      [fullname, email, username, password].some(
         (field) => field?.trim() === undefined
      )
   ) {
      throw new ApiError(400, "All fields are required");
   }
   const existedUser = await User.find({
      $or: [{ username }, { email }],
   });

   const checkEmail = existedUser?.filter((item) => item.email === email);
   const checkusername = existedUser?.filter(
      (item) => item.username === username
   );

   if (checkEmail.length > 0) {
      const checkVerication = checkEmail.some((item) => item.verified);
      if (checkVerication) {
         throw new ApiError(409, "User with email already exists");
      } else {
         await User.findByIdAndDelete(checkEmail[0]._id);
      }
   }
   if (checkusername.length > 0) {
      const checkVerication = checkusername.some((item) => item.verified);
      if (checkVerication) {
         throw new ApiError(
            409,
            "UserName is already registered, try something else."
         );
      } else {
         await User.findByIdAndDelete(checkusername[0]._id);
      }
   }

   const userCreated = await User.create({
      fullname,
      username,
      password,
      email,
      accountType: "user",
   });

   const user = await User.findById(userCreated._id).select("_id email username fullname avatar");

   if (!user) {
      throw new ApiError(400, "failed to regiter user Try again later");
   }
   const otp = generateOTP(6, "0123456789");
   const otpExpiry = new Date(Date.now() + 1800000);

   const otpSave = await Verify.findOneAndUpdate(
      {
         userId: user._id,
         otpFor: "registration",
      },
      {
         otp,
         otpExpiry,
      },
      { new: true, upsert: true }
   );

   const sendEmail = await transporter.sendMail({
      from: '"Chatzz" <chatzz@shubhamgoyal.dev>',
      to: user.email,
      subject: "Verify Your Email",
      html: VerificationEmailTemplate({
         fullname: user.fullname,
         email: user.email,
         username: user.username,
         otp: otp,
      }),
   });

   return res
      .status(200)
      .json(new ApiResponse(201, user, "user Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
   const { username, email, password } = req.body;

   if (!(username || email)) {
      throw new ApiError(400, "username or email required!");
   }

   const user = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiError(404, "username or email not Registered!");
   }

   const passCheck = await user.isPasswordCorrect(password);

   if (!passCheck) {
      throw new ApiError(401, "Invalid user credentials");
   }

   const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
   );

   const loggedInUser = await User.findById(user._id).select(
      "username email fullname _id avatar"
   );

   const options = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
   };

   return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser,
               accessToken,
               refreshToken,
            },
            "User logged In Successfully"
         )
      );
});

const logoutUser = asyncHandler(async (req, res) => {
   const user = await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset: { refreshToken: 1 },
      },
      { new: true }
   );

   const options = {
      httpOnly: true,
      secure: true,
   };

   res.status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out Successfully"));
});

const currentUser = asyncHandler(async (req, res) => {
   let r = {
      username: req.user.username,
      email: req.user.email,
      fullname: req.user.fullname,
      _id: req.user._id,
   };
   return res
      .status(200)
      .json(new ApiResponse(200, r, "User fetched successfully"));
});

const listUsers = asyncHandler(async (req, res) => {
   const { fullname } = req.body;

   if (!fullname) {
      throw new ApiError(401, "Name is required");
   }
   const userslist = await User.find({
      fullname: { $regex: fullname, $options: "i" },
   })
      .sort({ name: 1 })
      .select("username fullname _id avatar");

   res.status(200).json(
      new ApiResponse(200, userslist, "user list found successfully")
   );
});

const uploadAvatar = asyncHandler(async (req, res) => {
   let avatarLocalPath;
   if (
      req.files &&
      Array.isArray(req.files.avatar) &&
      req.files.avatar.length > 0
   ) {
      avatarLocalPath = req.files.avatar[0].path;
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath);

   if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
   }

   const avatarchange = await User.findByIdAndUpdate(req.user._id, {
      avatar: avatar.public_id,
   }).select("username email fullname _id avatar");

   if (!avatarchange) {
      throw new ApiError(401, "Avatar change failed");
   }
   if (avatarchange.avatar.slice(0, 12) === "chat-profile") {
      await deleteCloudinaryImage(avatarchange.avatar);
   }
   avatarchange.avatar = avatar.public_id;
   return res
      .status(200)
      .json(new ApiResponse(200, avatarchange, "avatar change successfully"));
});

const changeAvatar = asyncHandler(async (req, res) => {
   const { avatar } = req.body;

   if (!avatar) {
      throw new ApiError(401, "Avatar is required");
   }
   const avatarchange = await User.findByIdAndUpdate(req.user._id, {
      avatar,
   }).select("username email fullname _id avatar");

   if (!avatarchange) {
      throw new ApiError(401, "Avatar change failed");
   }
   if (avatarchange.avatar?.slice(0, 12) === "chat-profile") {
      await deleteCloudinaryImage(avatarchange.avatar);
   }
   avatarchange.avatar = avatar;
   return res
      .status(200)
      .json(new ApiResponse(200, avatarchange, "avatar change successfully"));
});

const editUserDetails = asyncHandler(async (req, res) => {
   let { username, fullname, email, otp, otpFor } = req.body;
   const id = req.user._id;

   if (!username) {
      username = req.user.username;
   }
   if (!fullname) {
      fullname = req.user.fullname;
   }
   if (!email) {
      email = req.user.email;
   }

   const verify = await verifyOTP(id, otpFor, otp);

   if (verify) {
      await Verify.findByIdAndDelete(verify._id);
   }

   const updateuser = await User.findByIdAndUpdate(
      id,
      {
         $set: {
            username,
            fullname,
            email,
         },
      },
      { new: true }
   ).select("username email fullname _id avatar");

   if (!updateuser) {
      throw new ApiError(500, "user details update failed");
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            updateuser,
            "Account details updated successfully"
         )
      );
});

const editUserDetailsSendOtp = asyncHandler(async (req, res) => {
   const id = req.user?._id;
   const otp = generateOTP(6, "0123456789");
   const otpExpiry = new Date(Date.now() + 1800000);

   const otpSave = await Verify.findOneAndUpdate(
      {
         userId: id,
         otpFor: "updateDetails",
      },
      {
         otp,
         otpExpiry,
      },
      { new: true, upsert: true }
   );

   const sendEmail = await transporter.sendMail({
      from: '"Chatzz" <chatzz@shubhamgoyal.dev>',
      to: req.user?.email,
      subject: "Update User Details",
      html: VerificationEmailTemplate({
         fullname: req?.user?.fullname,
         email: req?.user?.email,
         username: req?.user?.username,
         otp: otp,
      }),
   });

   if (!otpSave) {
      throw new ApiError(500, "Failed to generate OTP");
   }

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "OTP Send successfully"));
});

const forgotPassword = asyncHandler(async (req, res) => {
   const { username, email } = req.body;

   if (!(username || email)) {
      throw new ApiError(400, "username or email required!");
   }

   const user = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiError(404, "username or email not Registered!");
   }

   const otp = generateOTP(6, "0123456789");

   await Verify.create({
      userId: user._id,
      otpFor: "forgetPassword",
      otp,
   });

   await transporter.sendMail({
      from: '"Chatzz" <chatzz@shubhamgoyal.dev>',
      to: user.email,
      subject: "Password Recovery Mail",
      html: forgotPasswordEmailTemplate({
         fullname: user.fullname,
         email: user.email,
         otp: otp,
      }),
   });

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            {},
            "Password Reset Email has been send to your registed Email"
         )
      );
});

const verifyOTP = async (id, otpFor, otp) => {
   try {
      const DbOtp = await Verify.findOne({ userId: id, otpFor });

      if (!DbOtp) {
         throw new ApiError(404, "OTP not requested!");
      }

      if (DbOtp.otp != otp) {
         throw new ApiError(403, "Invalid OTP");
      }
      return DbOtp._id;
   } catch (error) {
      console.log(error);
      throw new ApiError(
         error.statusCode || 500,
         error.message || "something went wrong333"
      );
   }
};

const checkOtp = asyncHandler(async (req, res) => {
   const { username, email, otp, otpFor } = req.body;

   if (!(username || email)) {
      throw new ApiError(400, "username or email required!");
   }

   const user = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiError(404, "username or email not Registered!");
   }

   const check = await verifyOTP(user._id, otpFor, otp);
   if (!check) {
      throw new ApiError(404, "Otp is not valid");
   }

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "OTP is successfully Verified"));
});

const resetPassword = asyncHandler(async (req, res) => {
   const { username, email, otp, password } = req.body;

   if (!(username || email) && !otp && !password) {
      throw new ApiError(400, "All fields are required!");
   }

   const user = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (!user) {
      throw new ApiError(404, "username or email not Registered!");
   }

   const otpcheck = await Verify.findOne({
      userId: user._id,
      otpFor: "forgetPassword",
   });

   if (!otpcheck) {
      throw new ApiError(404, "OTP Not Requested");
   }

   if (otpcheck.otp != otp) {
      throw new ApiError(403, "Invalid OTP");
   }

   user.password = password;
   await user.save({ validateBeforeSave: true });

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password Reset successfully"));
});

function generateOTP(length, digits) {
   let OTP = "";
   let len = digits.length;
   for (let i = 0; i < length; i++) {
      OTP += digits[Math.floor(Math.random() * len)];
   }
   return OTP;
}

export {
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
};
