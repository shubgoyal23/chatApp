import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
   {
      from: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         index: true,
      },
      to: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         index: true,
      },
      message: {
         type: String,
         required: true,
      },
      type: {
         type: String,
         emun: ["text", "image", "document"],
      },
      isEdited: {
         type: Boolean,
         default: false,
      },
      isDeleted: {
         type: Boolean,
         default: false,
      },
   },
   { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
