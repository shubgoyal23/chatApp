import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

const app = express();

app.use(
   cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
   })
);

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.resolve();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static(path.join(__dirname, "client/dist")));
app.use(cookieParser());

import userRouter from "./routes/user.route.js";
import messageRouter from "./routes/message.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/message", messageRouter);
export { app };
