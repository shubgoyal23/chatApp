import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
   {
      groupname: {
         type: String,
         required: true,
      },
      groupUniqueName: {
         type: String,
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
      members: {
        type: Array,
        required: true
      },
      admins: {
        type: Array,
        required: true
      },
      createdBy:{
        type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      avatar: String,
      description: String,
   },
   {
      timestamps: true,
   }
);

export const Group = mongoose.model("Group", GroupSchema);
