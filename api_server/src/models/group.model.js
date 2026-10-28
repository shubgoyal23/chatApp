import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
   {
      fullname: {
         type: String,
         required: true,
         trim: true,
         maxlength: [50, "Group name can be at most 50 characters"],
      },
      username: {
         type: String,
         index: true,
         unique: true,
         validate: {
            validator: function (v) {
               return /^[a-zA-Z0-9_.]{3,16}$/.test(v);
            },
            message: (props) =>
               `${props.value} is not a valid group username! Use 3 to 16 letters, digits, "." or "_".`,
         },
      },
      members: {
         type: [mongoose.Schema.Types.ObjectId],
         ref: "User",
         required: true,
      },
      admins: {
         type: [mongoose.Schema.Types.ObjectId],
         ref: "User",
         required: true,
      },
      createdBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
      avatar: String,
      about: {
         type: String,
         trim: true,
         maxlength: [300, "Description can be at most 300 characters"],
      },
      accountType: String,
   },
   {
      timestamps: true,
   }
);

GroupSchema.index({ members: 1 });

export const Group = mongoose.model("Group", GroupSchema);
