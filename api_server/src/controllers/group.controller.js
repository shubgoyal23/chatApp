import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import { Message } from "../models/message.model.js";
import { Redisclient, redisKey } from "../db/Redis.js";
import { objectId, objectIdList, str } from "../utils/validate.js";

const MAX_MEMBERS = 256;

// The socket server routes group messages using this Redis set of member ids.
const groupSetKey = (grp) => redisKey(`group:${grp._id.toString()}`);

const syncMembers = async (grp) => {
   const key = groupSetKey(grp);
   const members = grp.members.map((m) => m.toString());
   await Redisclient.multi().del(key).sAdd(key, members).exec();
};

const includesId = (list, id) =>
   (list ?? []).some((m) => m.toString() === id.toString());

const populated = (grp) =>
   grp.populate("members", "username fullname _id avatar");

// Loads the group and makes sure the caller may change it.
const loadGroup = async (grpId, user, { admin = true } = {}) => {
   const grp = await Group.findById(objectId(grpId, "group id"));
   if (!grp || !includesId(grp.members, user._id)) {
      throw new ApiError(404, "Group does not exist");
   }
   if (admin && !includesId(grp.admins, user._id)) {
      throw new ApiError(403, "Only group admins can do this");
   }
   return grp;
};

const assertUsersExist = async (ids) => {
   const count = await User.countDocuments({ _id: { $in: ids } });
   if (count !== ids.length) {
      throw new ApiError(400, "One or more members do not exist");
   }
};

const CreateGroup = asyncHandler(async (req, res) => {
   const groupname = str(req.body?.groupname, { max: 50 });
   const groupUniqueName = str(req.body?.groupUniqueName, { max: 16 });
   const description = str(req.body?.description, { max: 300 });
   const user = req.user;

   if (!groupname || !groupUniqueName) {
      throw new ApiError(400, "Group name and username are required");
   }

   const members = objectIdList(req.body?.members ?? []).filter(
      (m) => !m.equals(user._id)
   );
   if (members.length < 1) {
      throw new ApiError(400, "Add at least one member");
   }
   if (members.length + 1 > MAX_MEMBERS) {
      throw new ApiError(400, `A group can have at most ${MAX_MEMBERS} members`);
   }
   if (await Group.exists({ username: groupUniqueName })) {
      throw new ApiError(409, "Group username already exists");
   }
   await assertUsersExist(members);

   const grp = await Group.create({
      fullname: groupname,
      admins: [user._id],
      username: groupUniqueName,
      members: [user._id, ...members],
      about: description,
      createdBy: user._id,
      accountType: "group",
   });

   try {
      await syncMembers(grp);
   } catch (err) {
      await Group.deleteOne({ _id: grp._id });
      throw new ApiError(503, "Failed to create group, try again later");
   }

   return res
      .status(201)
      .json(new ApiResponse(201, await populated(grp), "Group created successfully"));
});

const DeleteGroup = asyncHandler(async (req, res) => {
   const grp = await loadGroup(req.body?.grpId, req.user);
   if (!grp.createdBy?.equals(req.user._id)) {
      throw new ApiError(403, "Only the group creator can delete it");
   }

   await Redisclient.del(groupSetKey(grp));
   await Message.deleteMany({ to: grp._id });
   await grp.deleteOne();

   return res
      .status(200)
      .json(new ApiResponse(200, {}, "Group deleted successfully"));
});

const LeaveGroup = asyncHandler(async (req, res) => {
   const grp = await loadGroup(req.body?.grpId, req.user, { admin: false });
   const me = req.user._id.toString();
   grp.members = grp.members.filter((m) => m.toString() !== me);
   grp.admins = grp.admins.filter((m) => m.toString() !== me);

   if (grp.members.length === 0) {
      await Redisclient.del(groupSetKey(grp));
      await Message.deleteMany({ to: grp._id });
      await grp.deleteOne();
   } else {
      // never leave a group without an admin
      if (grp.admins.length === 0) grp.admins = [grp.members[0]];
      await grp.save();
      await Redisclient.sRem(groupSetKey(grp), me);
   }
   return res.status(200).json(new ApiResponse(200, {}, "You left the group"));
});

const AddMembers = asyncHandler(async (req, res) => {
   const grp = await loadGroup(req.body?.grpId, req.user);
   const members = objectIdList(req.body?.members).filter(
      (m) => !includesId(grp.members, m)
   );
   if (members.length < 1) {
      throw new ApiError(400, "Select at least one new member");
   }
   if (grp.members.length + members.length > MAX_MEMBERS) {
      throw new ApiError(400, `A group can have at most ${MAX_MEMBERS} members`);
   }
   await assertUsersExist(members);

   grp.members.push(...members);
   await grp.save();
   await syncMembers(grp);

   return res
      .status(200)
      .json(new ApiResponse(200, await populated(grp), "Members added successfully"));
});

const RemoveMembers = asyncHandler(async (req, res) => {
   const grp = await loadGroup(req.body?.grpId, req.user);
   const remove = objectIdList(req.body?.members).map((m) => m.toString());
   if (remove.length < 1) {
      throw new ApiError(400, "Select at least one member");
   }
   if (grp.createdBy && remove.includes(grp.createdBy.toString())) {
      throw new ApiError(403, "The group creator cannot be removed");
   }

   grp.members = grp.members.filter((m) => !remove.includes(m.toString()));
   grp.admins = grp.admins.filter((m) => !remove.includes(m.toString()));
   if (grp.admins.length === 0 && grp.members.length > 0) {
      grp.admins = [grp.members[0]];
   }
   await grp.save();
   await syncMembers(grp);

   return res
      .status(200)
      .json(new ApiResponse(200, await populated(grp), "Members removed successfully"));
});

const AddAdmin = asyncHandler(async (req, res) => {
   const grp = await loadGroup(req.body?.grpId, req.user);
   const adminid = objectId(req.body?.adminid, "admin id");

   if (!includesId(grp.members, adminid)) {
      throw new ApiError(400, "Only members can become admins");
   }
   if (!includesId(grp.admins, adminid)) {
      grp.admins.push(adminid);
      await grp.save();
   }

   return res
      .status(200)
      .json(new ApiResponse(200, await populated(grp), "Admin added successfully"));
});

const RemoveAdmin = asyncHandler(async (req, res) => {
   const grp = await loadGroup(req.body?.grpId, req.user);
   const adminid = objectId(req.body?.adminid, "admin id");

   // only the creator can demote other admins; anyone can step down
   const isCreator = grp.createdBy?.equals(req.user._id);
   if (!isCreator && !adminid.equals(req.user._id)) {
      throw new ApiError(403, "You can't remove this admin");
   }
   if (grp.createdBy?.equals(adminid)) {
      throw new ApiError(403, "The group creator is always an admin");
   }
   grp.admins = grp.admins.filter((m) => !m.equals(adminid));
   if (grp.admins.length === 0) {
      throw new ApiError(400, "A group needs at least one admin");
   }
   await grp.save();

   return res
      .status(200)
      .json(new ApiResponse(200, await populated(grp), "Admin removed successfully"));
});

const changeName = asyncHandler(async (req, res) => {
   const name = str(req.body?.name, { max: 50 });
   if (!name) {
      throw new ApiError(400, "Name is required");
   }
   const grp = await loadGroup(req.body?.grpId, req.user);
   grp.fullname = name;
   await grp.save();

   return res
      .status(200)
      .json(new ApiResponse(200, await populated(grp), "Group name changed successfully"));
});

const changeDescription = asyncHandler(async (req, res) => {
   const description = str(req.body?.description, { max: 300 });
   const grp = await loadGroup(req.body?.grpId, req.user);
   grp.about = description;
   await grp.save();

   return res
      .status(200)
      .json(new ApiResponse(200, await populated(grp), "Description changed successfully"));
});

const checkGroupUniqueness = asyncHandler(async (req, res) => {
   const groupUniqueName = str(req.body?.groupUniqueName, { max: 16 });
   if (!groupUniqueName) {
      throw new ApiError(400, "Group username is required");
   }
   if (!/^[a-zA-Z0-9_.]{3,16}$/.test(groupUniqueName)) {
      return res
         .status(200)
         .json(new ApiResponse(200, { available: false }, "Use 3-16 letters, digits, '.' or '_'"));
   }

   const taken = await Group.exists({ username: groupUniqueName });
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            { available: !taken },
            taken ? "Group username is not available" : "Group username is available"
         )
      );
});

export {
   CreateGroup,
   AddMembers,
   RemoveMembers,
   changeDescription,
   DeleteGroup,
   LeaveGroup,
   AddAdmin,
   RemoveAdmin,
   changeName,
   checkGroupUniqueness,
};
