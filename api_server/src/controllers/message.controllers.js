import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Message } from "../models/message.model.js";
import { Group } from "../models/group.model.js";
import { objectId } from "../utils/validate.js";

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
   const { page = 1, limit = 30 } = req.body ?? {};
   const user = req.user;
   const to = objectId(req.body?.to, "chat id");

   const pageNumber = Math.max(1, Math.floor(Number(page)) || 1);
   const pageLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 30));
   const skip = (pageNumber - 1) * pageLimit;

   // a group's history is every message addressed to it, visible to members only
   const group = await Group.findById(to).select("members");
   let filter;
   if (group) {
      if (!group.members.some((m) => m.equals(user._id))) {
         throw new ApiError(403, "You are not a member of this group");
      }
      filter = { to };
   } else {
      filter = {
         $or: [
            { from: user._id, to },
            { from: to, to: user._id },
         ],
      };
   }

   const listMessage = await Message.find(filter)
      .sort({ epoch: -1, _id: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean();

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
   }).lean();

   // attach each group's latest message so the client can sort and preview it
   const latest = groups.length
      ? await Message.aggregate([
           { $match: { to: { $in: groups.map((g) => g._id) } } },
           { $sort: { epoch: -1, _id: -1 } },
           { $group: { _id: "$to", lastMessage: { $first: "$$ROOT" } } },
        ])
      : [];
   const latestById = new Map(latest.map((l) => [l._id.toString(), l.lastMessage]));
   for (const g of groups) {
      const m = latestById.get(g._id.toString());
      g.lastMessage = m
         ? { ...m, id: m._id }
         : { message: "", epoch: Math.floor(new Date(g.createdAt).getTime() / 1000) };
   }

   listMessage.push(...groups);
   listMessage.sort((a, b) => (b.lastMessage?.epoch ?? 0) - (a.lastMessage?.epoch ?? 0));

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
