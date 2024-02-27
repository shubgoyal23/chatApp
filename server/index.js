import connectDb from "./db/connectDb.js";
import dotenv from "dotenv";
import { server } from "./socke.js";

dotenv.config({ path: "./.env" });

const port = process.env.PORT;

connectDb()
   .then(() => {
      server.listen(port, () => {
         console.log(`server Started at http://localhost:${port}`);
      });
   })
   .catch((error) => console.log("connection to Db failed", error));
