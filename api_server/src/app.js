import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { rateLimit } from "express-rate-limit";
import { ApiError } from "./utils/ApiError.js";

// Rejects bodies carrying MongoDB operators ({"$ne": ...}) or prototype keys;
// controllers also coerce every field to the type they expect.
const hasUnsafeKeys = (value, depth = 0) => {
   if (depth > 8) return true;
   if (Array.isArray(value)) return value.some((v) => hasUnsafeKeys(v, depth + 1));
   if (value && typeof value === "object") {
      return Object.keys(value).some(
         (k) => k.startsWith("$") || k === "__proto__" || k === "constructor" || hasUnsafeKeys(value[k], depth + 1)
      );
   }
   return false;
};

const app = express();

// Behind nginx: trust the first proxy so rate limiting sees the real client IP.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
app.disable("x-powered-by");

app.use(helmet());
app.use(
   cors({
      origin: (process.env.CORS_ORIGIN ?? "")
         .split(",")
         .map((o) => o.trim())
         .filter(Boolean),
      credentials: true,
   })
);

app.use(
   "/api",
   rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { success: false, message: "Too many requests, slow down." },
   })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
   if (hasUnsafeKeys(req.body) || hasUnsafeKeys(req.query)) {
      return res.status(400).json({ success: false, message: "Invalid input" });
   }
   next();
});

import userRouter from "./routes/user.route.js";
import messageRouter from "./routes/message.route.js";
import groupRouter from "./routes/group.route.js";

app.get("/ping", (req, res) => {
   // 1 = connected; lets the container health check catch a lost database
   if (mongoose.connection.readyState !== 1) {
      return res.status(503).send("database unavailable");
   }
   res.send("pong");
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/group", groupRouter);

app.use((req, res) => {
   res.status(404).json({ success: false, message: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
   if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
         success: false,
         message: err.message,
         errors: err.errors,
      });
   }
   if (err?.type === "entity.too.large") {
      return res
         .status(413)
         .json({ success: false, message: "Request is too large" });
   }
   if (err?.name === "MulterError") {
      return res.status(400).json({ success: false, message: err.message });
   }
   if (err?.name === "ValidationError") {
      const message = Object.values(err.errors ?? {})[0]?.message;
      return res
         .status(400)
         .json({ success: false, message: message || "Invalid input" });
   }
   if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern ?? {})[0] ?? "value";
      return res
         .status(409)
         .json({ success: false, message: `This ${field} is already taken` });
   }
   if (err?.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid id" });
   }
   console.error(err);
   // never leak internal error details to clients
   res.status(500).json({ success: false, message: "Internal Server Error" });
});

export { app };
