import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED = {
   "image/jpeg": ".jpg",
   "image/png": ".png",
   "image/webp": ".webp",
   "image/gif": ".gif",
};

const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, path.resolve("./public/temp"));
   },
   // never trust the client's file name: it can contain "../" path segments
   filename: function (req, file, cb) {
      cb(null, `${crypto.randomUUID()}${ALLOWED[file.mimetype]}`);
   },
});

export const upload = multer({
   storage,
   limits: { fileSize: 5 * 1024 * 1024, files: 1 },
   fileFilter: (req, file, cb) => {
      if (!ALLOWED[file.mimetype]) {
         return cb(new ApiError(400, "Only JPG, PNG, WEBP or GIF images are allowed"));
      }
      cb(null, true);
   },
});
