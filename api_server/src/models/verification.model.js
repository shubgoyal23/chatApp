import mongoose from "mongoose";

const VerificationSchema = new mongoose.Schema(
   {
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      otp: String,
      otpFor: String,
      // MongoDB's TTL monitor removes the document once this passes
      otpExpiry: {
         type: Date,
         default: () => new Date(Date.now() + 15 * 60 * 1000),
         index: { expires: 0 },
      },
      attempts: { type: Number, default: 0 },
   },
   {
      timestamps: true,
   }
);

VerificationSchema.index({ userId: 1, otpFor: 1 });

export const Verify = mongoose.model("Verify", VerificationSchema);
