import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
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
   },
   media: {
      type: String,
   },
   replyTo: {
      type: String,
   },
   epoch: {
      type: Number,
   },
   // id: {
   //    type: String,
   // },
});

messageSchema.index({ from: 1, to: 1, epoch: -1 });
messageSchema.index({ to: 1, epoch: -1 });

export const Message = mongoose.model("Message", messageSchema);
