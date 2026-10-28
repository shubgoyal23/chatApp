import mongoose from "mongoose";

const connectDb = async () => {
   if (mongoose.connection.readyState === 1) return;
   const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.MONGO_DB}`
   );
   console.log(
      "mongoDb connection sucess: ",
      connectionInstance.connection.host
   );
};

export default connectDb;
