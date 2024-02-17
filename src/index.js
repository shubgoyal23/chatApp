import connectDb from "./db/connectDb.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const port = 8000;

connectDb()
   .then(() => {
      app.listen(port, () => {
         console.log(`server Started at http://localhost:${port}`);
      });
   })
   .catch((error) => console.log("connection to Db failed", error));
