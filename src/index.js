import connectDb from "./db/connectDb.js";
import Express from "express";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const app = Express();
const port = 8000;

connectDb()
   .then(() => {
      app.listen(port, () => {
         console.log(`server Started at http://localhost:${port}`);
      });
   })
   .catch(error => console.log("connection to Db failed"));
