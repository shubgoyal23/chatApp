import mongoose from "mongoose";

const VerificationSchema = new mongoose.Schema(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "users",
         required: true,
      },
      otp: String,
      otpExpiry: Date,
      otpFor: String,
   },
   {
      timestamps: true,
   }
);

export const Verify = mongoose.model("Verify", VerificationSchema);
