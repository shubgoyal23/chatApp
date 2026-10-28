import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema(
   {
      fullname: {
         type: String,
         required: true,
         trim: true,
         maxlength: [50, "Full name can be at most 50 characters"],
      },
      username: {
         type: String,
         required: true,
         index: true,
         unique: true,
         validate: {
            validator: function (v) {
               return /^[a-zA-Z0-9_.]{3,16}$/.test(v);
            },
            message: (props) =>
               `${props.value} is not a valid username! Minimum 3 and maximum 16 characters are allowed. You can only use lowercase letters (a to z), uppercase letters (A to Z), digits (0 to 9) or ".", "_" as special characters.`,
         },
      },
      email: {
         type: String,
         required: true,
         index: true,
         unique: true,
         lowercase: true,
         validate: {
            validator: function (v) {
               return /^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/.test(
                  v
               );
            },
            message: (props) => `${props.value} is not a valid email address!`,
         },
      },
      password: {
         type: String,
         required: true,
         validate: {
            validator: function (v) {
               return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
                  v
               );
            },
            message: (props) =>
               `Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one digit, and one special character.`,
         },
      },
      verified: {
         type: Boolean,
         default: false,
      },
      avatar: String,
      about: {
         type: String,
         trim: true,
         maxlength: [200, "About can be at most 200 characters"],
      },
      refreshToken: String,
      // access tokens issued before this instant are rejected (logout, password reset)
      tokensValidAfter: Date,
      accountType: String,
   },
   {
      timestamps: true,
   }
);

UserSchema.pre("save", async function () {
   if (!this.isModified("password")) return;

   this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
   return jwt.sign(
      {
         _id: this._id,
         email: this.email,
         username: this.username,
         fullName: this.fullname,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         algorithm: "HS256",
         expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
      }
   );
};
UserSchema.methods.generateRefreshToken = function () {
   return jwt.sign(
      {
         _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
         algorithm: "HS256",
         expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
      }
   );
};
export const User = mongoose.model("User", UserSchema);
