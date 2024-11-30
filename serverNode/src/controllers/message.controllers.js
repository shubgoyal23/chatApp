import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

const newMessage = asyncHandler(async (req, res) => {
   const { to, message } = req.body;
   const user = req.user;

   if ([to, message].some((field) => field?.trim() === undefined)) {
      throw new ApiError(400, "message is required");
   }

   const messageCreate = await Message.create({
      from: user._id,
      to,
      message,
   });

   if (!messageCreate) {
      throw new ApiError(400, "failed to send message Try again later");
   }

   return res
      .status(200)
      .json(new ApiResponse(201, messageCreate, "message send Successfully"));
});

const allMessage = asyncHandler(async (req, res) => {
   const { to } = req.body;
   const user = req.user;

   if (to === undefined || to === "") {
      throw new ApiError(400, "To id is required");
   }

   const listMessage = await Message.find({
      $or: [
         { from: user._id, to: to },
         { from: to, to: user._id },
      ],
   }).sort({ createdAt: 1 });

   return res
      .status(200)
      .json(new ApiResponse(201, listMessage, "messages feched Successfully"));
});

const userContacts = asyncHandler(async (req, res) => {
   const user = req.user;

   // const listMessage = await Message.aggregate([
   //    {
   //       $match: {
   //          $or: [{ from: user._id }, { to: user._id }],
   //       },
   //    },
   //    {
   //       $group: {
   //          _id: null,
   //          uniqueAccounts: { $addToSet: "$from" },
   //          uniqueAccounts2: { $addToSet: "$to" },
   //       },
   //    },
   //    {
   //       $project: {
   //          uniqueAccounts: {
   //             $setUnion: ["$uniqueAccounts", "$uniqueAccounts2"],
   //          },
   //       },
   //    },
   //    {
   //       $unwind: "$uniqueAccounts",
   //    },
   //    {
   //       $lookup: {
   //          from: "users",
   //          localField: "uniqueAccounts",
   //          foreignField: "_id",
   //          as: "user",
   //       },
   //    },
   //    {
   //       $unwind: "$user", // Deconstruct the "user" array
   //    },
   //    {
   //       $project: {
   //          _id: null, // Exclude null _id field
   //          username: "$user.username",
   //          id: "$user._id", // Assuming "_id" field exists in the user object
   //          fullname: "$user.fullname",
   //          email: "$user.email",
   //          avatar: "$user.avatar",
   //       },
   //    },
   // ]);
   // const uniqueAccountIds = listMessage[0].uniqueAccounts;

   // if (!uniqueAccountIds) {
   //    throw new ApiError(400, "no account Found");
   // }

   // const list = await User.find({ _id: { $in: uniqueAccountIds } }).select(
   //    "-password -refreshToken -createdAt -updatedAt -otp -otpExpiry"
   // );

   // if (!list) {
   //    throw new ApiError(400, "no account Found");
   // }

   const listMessage = await Message.aggregate([
      {
         $match: {
            $or: [{ from: user._id }, { to: user._id }],
         },
      },
      {
         $group: {
            _id: null,
            uniqueAccounts: {
               $addToSet: {
                  $cond: [{ $eq: ["$from", user._id] }, "$to", "$from"],
               },
            },
         },
      },
      {
         $unwind: "$uniqueAccounts",
      },
      {
         $lookup: {
            from: "users",
            localField: "uniqueAccounts",
            foreignField: "_id",
            as: "user",
         },
      },
      {
         $unwind: "$user",
      },
      {
         $project: {
            username: "$user.username",
            _id: "$user._id",
            fullname: "$user.fullname",
            email: "$user.email",
            avatar: "$user.avatar",
         },
      },
   ]);

   return res
      .status(200)
      .json(new ApiResponse(201, listMessage, "messages feched Successfully"));
});

const editMessage = asyncHandler(async (req, res) => {
   const { id, message } = req.body;
   const user = req.user;

   if ([id, message].some((field) => field?.trim() === undefined)) {
      throw new ApiError(400, "message is required");
   }

   const findMessage = await Message.findById(id);

   if (!findMessage) {
      throw new ApiError(400, "failed to send message Try again later");
   }

   return res
      .status(200)
      .json(new ApiResponse(201, messageCreate, "message send Successfully"));
});

export { newMessage, allMessage, userContacts };
