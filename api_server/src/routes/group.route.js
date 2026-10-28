import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
   AddAdmin,
   AddMembers,
   changeDescription,
   changeName,
   checkGroupUniqueness,
   CreateGroup,
   DeleteGroup,
   LeaveGroup,
   RemoveAdmin,
   RemoveMembers,
} from "../controllers/group.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/new").post(CreateGroup);
router.route("/delete").post(DeleteGroup);
router.route("/leave").post(LeaveGroup);
router.route("/add/member").post(AddMembers);
router.route("/add/admin").post(AddAdmin);
router.route("/remove/member").post(RemoveMembers);
router.route("/remove/admin").post(RemoveAdmin);

router.route("/description").post(changeDescription);
router.route("/name").post(changeName);
router.route("/check-group-name").post(checkGroupUniqueness);

export default router;
