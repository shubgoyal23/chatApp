import mongoose from "mongoose";

let MongoDbConnected = false;

const connectDb = async () => {
   if (MongoDbConnected) return;
   try {
      const connectionInstance = await mongoose.connect(
         `${process.env.MONGODB_URI}/${process.env.MONGO_DB}`
      );
      console.log(
         "mongoDb connection sucess: ",
         connectionInstance.connection.host
      );
      if (connectionInstance.connection.host) {
         MongoDbConnected = true;
      }
   } catch (error) {
      console.log("mongoDb connection failed: ", error);
      process.exit(1);
   }
};

export default connectDb;
