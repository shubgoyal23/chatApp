import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

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

   const passCheck = user.isPasswordCorrect(password);

   if (!passCheck) {
      throw new ApiError(401, "Invalid user credentials");
   }

   return res.status(200).json(
      new ApiResponse(
         200,
         {
            user,
         },
         "User logged In Successfully"
      )
   );
});

export { registerUser, loginUser };
