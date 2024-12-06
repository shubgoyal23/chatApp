import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allMessage, userContacts } from "../controllers/message.controllers.js";
import { ApiError } from "../utils/ApiError.js";

const router = Router();

// router.route("/new").post(verifyJWT, newMessage);
router.route("/all").post(verifyJWT, allMessage);
router.route("/contacts").post(verifyJWT, userContacts);

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