import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Group } from "../models/group.model.js";

const CreateGroup = asyncHandler(async (req, res) => {
   const { name, username, description, members } = req.body;
   const user = req.user;

   if ([name].some((field) => field?.trim() === undefined)) {
      throw new ApiError(400, `${field} is required`);
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

   const grp = await Group.create({
      groupname: name,
      admins: [user._id],
      username,
      members,
      description,
      createdBy: user._id,
   });

   if (!grp) {
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
      throw new ApiError(
         400,
         `invalid admin id`
      );
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

export {
   CreateGroup,
   AddMembers,
   RemoveMembers,
   changeDescription,
   DeleteGroup,
   AddAdmin,
   RemoveAdmin,
   changeName
};
