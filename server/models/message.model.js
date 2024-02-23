import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
   {
      from: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      to: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      message: {
         type: String,
         required: true,
      },
   },
   { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
