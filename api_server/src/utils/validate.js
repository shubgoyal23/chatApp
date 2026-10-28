import mongoose from "mongoose";
import { ApiError } from "./ApiError.js";

// Request bodies are untrusted JSON: a field may be an object, array or number.
// These helpers coerce to the expected primitive or reject the request.

export const str = (value, { max = 200, trim = true } = {}) => {
   if (value === undefined || value === null) return "";
   if (typeof value !== "string") {
      throw new ApiError(400, "Invalid input");
   }
   const v = trim ? value.trim() : value;
   if (v.length > max) {
      throw new ApiError(400, "Input is too long");
   }
   return v;
};

export const objectId = (value, name = "id") => {
   if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
      throw new ApiError(400, `Invalid ${name}`);
   }
   return new mongoose.Types.ObjectId(value);
};

export const objectIdList = (value, name = "members", max = 256) => {
   if (!Array.isArray(value)) {
      throw new ApiError(400, `${name} must be a list`);
   }
   if (value.length > max) {
      throw new ApiError(400, `Too many ${name}`);
   }
   const unique = [...new Set(value.map((v) => objectId(v, name).toString()))];
   return unique.map((v) => new mongoose.Types.ObjectId(v));
};

// Users may log in with either their username or their email.
export const identifierQuery = (body) => {
   const identifier = str(body?.username || body?.email, { max: 100 });
   if (!identifier) {
      throw new ApiError(400, "Username or email is required");
   }
   return identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { username: identifier };
};

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
