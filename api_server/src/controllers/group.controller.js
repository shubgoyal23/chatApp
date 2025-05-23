import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Group } from "../models/group.model.js";
import { Redisclient } from "../db/Redis.js";

const CreateGroup = asyncHandler(async (req, res) => {
   const { groupname, groupUniqueName, description, members } = req.body;
   const user = req.user;

   if (!groupname || !groupUniqueName || !description) {
      throw new ApiError(400, `All fields are required`);
   }

   if (!members || members.length < 1) {
      throw new ApiError(400, `At least one member is required`);
   }
   const check = await Group.findOne({ groupUniqueName });
   if (check) {
      throw new ApiError(400, `group name already exists`);
   }
   let m = [];
   for (let i = 0; i < members.length; i++) {
      const findusers = await User.findById(members[i]);
      if (!findusers) {
         throw new ApiError(
            400,
            `members contain one or more members which does not exists`
         );
      }
      m.push(findusers._id);
   }

   const grp = await Group.create({
      fullname: groupname,
      admins: [user._id],
      username: groupUniqueName,
      members: [...m, user._id],
      about: description,
      createdBy: user._id,
      accountType: "group",
   });

   if (!grp) {
      throw new ApiError(400, `Failed to create group, Try again later`);
   }

   members.push(user._id.toString());
   let val = await Redisclient.SADD(`group:${grp._id}`, members);
   if (val !== members.length) {
      await Group.findByIdAndDelete(grp._id);
      Redisclient.DEL(`group:${grp._id}`);
      throw new ApiError(400, `Failed to create group, Try again later`);
   }

   return res
      .status(200)
      .json(new ApiResponse(201, grp, "group created Successfully"));
});
const DeleteGroup = asyncHandler(async (req, res) => {
   const { grpId } = req.body;
   const user = req.user;

   if (!grpId) {
      throw new ApiError(400, `group id is required`);
   }

   const grp = await Group.findById(grpId);
   if (!grp) {
      throw new ApiError(400, `group does not exist`);
   }

   if (!grp?.admins?.includes(user._id)) {
      throw new ApiError(400, "You need to be admin to add members");
   }
   if (grp?.createdBy !== user._id) {
      throw new ApiError(400, "You can't delete this group");
   }

   await Redisclient.remove(`group:${grp._id.toHexString()}`);
   await grp.remove();

   return res
      .status(200)
      .json(new ApiResponse(201, {}, " group deleted Successfully"));
});

const AddMembers = asyncHandler(async (req, res) => {
   const { members, grpId } = req.body;
   const user = req.user;

   if (!grpId) {
      throw new ApiError(400, `group id is required`);
   }

   if (!members || members.length < 1) {
      throw new ApiError(400, `At least one member is required`);
   }
   for (let i = 0; i < members.length; i++) {
      const findusers = await User.findById(members[i]);
      if (!findusers) {
         throw new ApiError(
            400,
            `members contain one or more members which does not exists`
         );
      }
   }

   const grp = await Group.findById(grpId);

   if (!grp) {
      throw new ApiError(400, `group does not exist`);
   }

   if (!grp?.admins?.includes(user._id)) {
      throw new ApiError(400, "You need to be admin to add members");
   }

   grp.members = [...grp.members, ...members];
   await grp.save();
   let val = await Redisclient.SADD(`group:${grp._id}`, members);
   if (val !== members.length) {
      throw new ApiError(400, `Failed to add members, Try again later`);
   }

   return res
      .status(200)
      .json(new ApiResponse(201, grp, "members added Successfully"));
});
const RemoveMembers = asyncHandler(async (req, res) => {
   const { members, grpId } = req.body;
   const user = req.user;

   if (!grpId) {
      throw new ApiError(400, `group id is required`);
   }

   if (!members || members.length < 1) {
      throw new ApiError(400, `At least one member is required`);
   }
   for (let i = 0; i < members.length; i++) {
      const findusers = await User.findById(members[i]);
      if (!findusers) {
         throw new ApiError(
            400,
            `members contain one or more members which does not exists`
         );
      }
   }

   const grp = await Group.findById(grpId);

   if (!grp) {
      throw new ApiError(400, `group does not exist`);
   }

   if (!grp?.admins?.includes(user._id)) {
      throw new ApiError(400, "You need to be admin to add members");
   }

   grp.members.filter((member) => !members.includes(member));
   await grp.save();
   let val = await Redisclient.SREM(`group:${grp._id}`, members);
   if (val !== members.length) {
      throw new ApiError(400, `Failed to remove members, Try again later`);
   }

   return res
      .status(200)
      .json(new ApiResponse(201, grp, "members removed Successfully"));
});

const AddAdmin = asyncHandler(async (req, res) => {
   const { adminid, grpId } = req.body;
   const user = req.user;

   if (!grpId) {
      throw new ApiError(400, `group id is required`);
   }

   if (!adminid) {
      throw new ApiError(400, `admin id is required`);
   }

   const findusers = await User.findById(adminid);
   if (!findusers) {
      throw new ApiError(400, `invalid admin id`);
   }

   const grp = await Group.findById(grpId);

   if (!grp) {
      throw new ApiError(400, `group does not exist`);
   }

   if (!grp?.admins?.includes(user._id)) {
      throw new ApiError(400, "You need to be admin to add Admin");
   }

   grp.admins = [...grp.admins, adminid];
   await grp.save();

   return res
      .status(200)
      .json(new ApiResponse(201, grp, "members added Successfully"));
});
const RemoveAdmin = asyncHandler(async (req, res) => {
   const { adminid, grpId } = req.body;
   const user = req.user;

   if (!grpId) {
      throw new ApiError(400, `group id is required`);
   }

   if (!adminid) {
      throw new ApiError(400, `admin id is required`);
   }
   const findusers = await User.findById(adminid);
   if (!findusers) {
      throw new ApiError(400, `invalid admin id`);
   }
   const grp = await Group.findById(grpId);

   if (!grp) {
      throw new ApiError(400, `group does not exist`);
   }

   if (!grp?.admins?.includes(user._id)) {
      throw new ApiError(400, "You need to be admin to add members");
   }
   // check if the user is the creator of the group
   if (grp?.createdBy !== user._id && user._id !== adminid) {
      throw new ApiError(400, "You can't remove this admin");
   }

   grp.admins = grp.admins.filter((member) => member !== adminid);
   await grp.save();

   return res
      .status(200)
      .json(new ApiResponse(201, grp, "admin removed Successfully"));
});

const changeName = asyncHandler(async (req, res) => {
   const { name, grpId } = req.body;
   const user = req.user;

   if (!grpId) {
      throw new ApiError(400, `group id is required`);
   }

   if (!name) {
      throw new ApiError(400, "name is required");
   }

   const grp = await Group.findById(grpId);

   if (!grp) {
      throw new ApiError(400, `group does not exist`);
   }

   if (!grp?.admins?.includes(user._id)) {
      throw new ApiError(400, "You need to be admin to add members");
   }

   grp.groupname = name;
   await grp.save();

   return res
      .status(200)
      .json(new ApiResponse(201, grp, "group name changed Successfully"));
});

const changeDescription = asyncHandler(async (req, res) => {
   const { description, grpId } = req.body;
   const user = req.user;

   if (!grpId) {
      throw new ApiError(400, `group id is required`);
   }

   if (!description) {
      throw new ApiError(400, "description is required");
   }

   const grp = await Group.findById(grpId);

   if (!grp) {
      throw new ApiError(400, `group does not exist`);
   }

   if (!grp?.admins?.includes(user._id)) {
      throw new ApiError(400, "You need to be admin to add members");
   }

   grp.description = description;
   await grp.save();

   return res
      .status(200)
      .json(new ApiResponse(201, grp, "description changed Successfully"));
});

const checkGroupUniqueness = asyncHandler(async (req, res) => {
   const { groupUniqueName } = req.body;
   const user = req.user;

   if (!groupUniqueName) {
      throw new ApiError(400, "username is required");
   }

   const grp = await Group.findOne({ groupUniqueName: groupUniqueName });

   if (grp) {
      return res
         .status(200)
         .json(new ApiResponse(218, null, "group name is not available"));
   }

   return res
      .status(200)
      .json(new ApiResponse(200, null, "group name is available"));
});
export {
   CreateGroup,
   AddMembers,
   RemoveMembers,
   changeDescription,
   DeleteGroup,
   AddAdmin,
   RemoveAdmin,
   changeName,
   checkGroupUniqueness,
};
