import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { Group } from "../models/group.model.js";

// const newMessage = asyncHandler(async (req, res) => {
//    const { to, message } = req.body;
//    const user = req.user;

//    if ([to, message].some((field) => field?.trim() === undefined)) {
//       throw new ApiError(400, "message is required");
//    }

//    const messageCreate = await Message.create({
//       from: user._id,
//       to,
//       message,
//    });

//    if (!messageCreate) {
//       throw new ApiError(400, "failed to send message Try again later");
//    }

//    return res
//       .status(200)
//       .json(new ApiResponse(201, messageCreate, "message send Successfully"));
// });

const allMessage = asyncHandler(async (req, res) => {
   const { to, page = 1, limit = 20 } = req.body;
   const user = req.user;

   if (!to) {
      throw new ApiError(400, "To id is required");
   }

   const pageNumber = Math.max(1, Number(page));
   const pageLimit = Math.min(100, Math.max(1, Number(limit)));

   const skip = (pageNumber - 1) * pageLimit;

   const listMessage = await Message.find({
      $or: [
         { from: user._id, to: to },
         { from: to, to: user._id },
      ],
   })
      .sort({ epoch: -1, _id: -1 })
      .skip(skip)
      .limit(pageLimit);

   // Pagination is newest -> oldest,
   // but frontend wants oldest -> newest.
   listMessage.reverse();

   return res
      .status(200)
      .json(new ApiResponse(200, listMessage, "Messages fetched successfully"));
});

const userContacts = asyncHandler(async (req, res) => {
   const user = req.user;

   const listMessage = await Message.aggregate([
      // -----------------------------------------
      // 1. Get all messages involving current user
      // -----------------------------------------
      {
         $match: {
            $or: [{ from: user._id }, { to: user._id }],
         },
      },

      // -----------------------------------------
      // 2. Determine the other participant
      // -----------------------------------------
      {
         $project: {
            from: 1,
            to: 1,
            message: 1,
            type: 1,
            media: 1,
            replyTo: 1,
            epoch: 1,
            createdAt: 1,
            _id: 1,

            contactId: {
               $cond: [{ $eq: ["$from", user._id] }, "$to", "$from"],
            },
         },
      },

      // -----------------------------------------
      // 3. Newest message first
      // -----------------------------------------
      {
         $sort: {
            epoch: -1,
            _id: -1,
         },
      },

      // -----------------------------------------
      // 4. Get latest message for each contact
      // -----------------------------------------
      {
         $group: {
            _id: "$contactId",

            lastMessage: {
               $first: "$$ROOT",
            },
         },
      },

      // -----------------------------------------
      // 5. Sort contacts by latest message
      // -----------------------------------------
      {
         $sort: {
            "lastMessage.epoch": -1,
            "lastMessage._id": -1,
         },
      },

      // -----------------------------------------
      // 6. Get contact information
      // -----------------------------------------
      {
         $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
         },
      },

      {
         $unwind: "$user",
      },

      // -----------------------------------------
      // 7. Final response
      // -----------------------------------------
      {
         $project: {
            _id: "$user._id",
            username: "$user.username",
            fullname: "$user.fullname",
            avatar: "$user.avatar",

            lastMessage: {
               message: "$lastMessage.message",
               type: "$lastMessage.type",
               media: "$lastMessage.media",
               replyTo: "$lastMessage.replyTo",
               epoch: "$lastMessage.epoch",
               id: "$lastMessage._id",
               createdAt: "$lastMessage.createdAt",

               from: "$lastMessage.from",
               to: "$lastMessage.to",
            },
         },
      },
   ]);

   const groups = await Group.find({
      members: user._id,
   });

   listMessage.push(...groups);

   return res
      .status(200)
      .json(new ApiResponse(200, listMessage, "Messages fetched successfully"));
});

// const editMessage = asyncHandler(async (req, res) => {
//    const { id, message } = req.body;
//    const user = req.user;

//    if ([id, message].some((field) => field?.trim() === undefined)) {
//       throw new ApiError(400, "message is required");
//    }

//    const findMessage = await Message.findById(id);

//    if (!findMessage) {
//       throw new ApiError(400, "failed to send message Try again later");
//    }

//    return res
//       .status(200)
//       .json(new ApiResponse(201, messageCreate, "message send Successfully"));
// });

export { allMessage, userContacts };
