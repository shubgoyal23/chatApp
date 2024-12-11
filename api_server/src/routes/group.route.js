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
   RemoveAdmin,
   RemoveMembers,
} from "../controllers/group.controller.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

// router.route("/new").post(verifyJWT, newMessage);
router.route("/new").post(verifyJWT, CreateGroup);
router.route("/delete").post(verifyJWT, DeleteGroup);
router.route("/add/member").post(verifyJWT, AddMembers);
router.route("/add/admin").post(verifyJWT, AddAdmin);
router.route("/remove/member").post(verifyJWT, RemoveMembers);
router.route("/remove/admin").post(verifyJWT, RemoveAdmin);

router.route("/description").post(verifyJWT, changeDescription);
router.route("/name").post(verifyJWT, changeName);
router.route("/check-group-name").post(verifyJWT, checkGroupUniqueness);

router.use((err, req, res, next) => {
   if (err instanceof ApiError) {
      res.status(err.statusCode).json({
         success: false,
         message: err.message,
         errors: err.errors,
      });
   } else {
      console.error(err);
      res.status(500).json({
         success: false,
         message: err.message,
      });
   }
});
export default router;
