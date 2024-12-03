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
    if (!members || members.length < 1){
       throw new ApiError(400, `At least one member is required`);
    }
    for (let i = 0; i < members.length; i++){
       const findusers = await User.findById(members[i]);
       if (!findusers){
          throw new ApiError(400, `members contain one or more members which does not exists`);
       }
    }
 
    const grp = await Group.create({
        groupname: name,
        admins : [user._id],
        username,
        members,
        description,
        createdBy: user._id,
    })
    
    if (!grp){
        throw new ApiError(400, `Failed to create group, Try again later`);
    }
 
    return res
       .status(200)
       .json(new ApiResponse(201, grp, "group created Successfully"));
 });

 export {CreateGroup}