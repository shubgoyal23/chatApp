import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {
   deleteCloudinaryImage,
   uploadOnCloudinary,
} from "../utils/cloudinary.js";

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
   const existedUser = await User.findOne({
      $or: [{ username }, { email }],
   });

   if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
   }

   const userCreated = await User.create({
      fullname,
      username,
      password,
      email,
   });

   const user = await User.findById(userCreated._id).select("-password");

   if (!user) {
      throw new ApiError(400, "failed to regiter user Try again later");
   }

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
      "-password -refreshToken"
   );

   const options = {
      httpOnly: true,
      secure: true,
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
   return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User fetched successfully"));
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
      .select("-password -refreshToken -createdAt -updatedAt -email");

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
   }).select("-password -refreshToken -createdAt -updatedAt ");

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
   }).select("-password -refreshToken -createdAt -updatedAt ");

   if (!avatarchange) {
      throw new ApiError(401, "Avatar change failed");
   }
   if (avatarchange.avatar.slice(0, 12) === "chat-profile") {
      await deleteCloudinaryImage(avatarchange.avatar);
   }
   avatarchange.avatar = avatar;
   return res
      .status(200)
      .json(new ApiResponse(200, avatarchange, "avatar change successfully"));
});

const editUserDetails = asyncHandler(async (req, res) => {
   let { username, fullname, email } = req.body;
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
   ).select("-password");

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

export {
   registerUser,
   loginUser,
   logoutUser,
   currentUser,
   listUsers,
   changeAvatar,
   uploadAvatar,
   editUserDetails,
};
