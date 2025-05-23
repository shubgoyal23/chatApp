import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDb from "./db/connectDb.js";

const app = express();

app.use(
   cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
   })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use(async (req, res, next) => {
   await connectDb().catch((err) =>
      res.status(500).json({
         success: false,
         message: "Internal Server Error",
      })
   );
   next();
});

import userRouter from "./routes/user.route.js";
import messageRouter from "./routes/message.route.js";
import groupRouter from "./routes/group.route.js";
app.get("/ping", (req, res) => {
   res.send("pong");
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/group", groupRouter);
export { app };
