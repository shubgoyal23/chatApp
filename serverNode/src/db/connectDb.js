import mongoose from "mongoose";

const connectDb = async () => {
   try {
      const connectionInstance = await mongoose.connect(
         `${process.env.MONGODB_URI}/whatsapp`
      );
      console.log(
         "mongoDb connection sucess: ",
         connectionInstance.connection.host
      );
   } catch (error) {
      console.log("mongoDb connection failed: ", error);
      process.exit(1);
   }
};

export default connectDb;
