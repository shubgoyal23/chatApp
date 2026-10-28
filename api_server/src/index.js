import "dotenv/config";
import { app } from "./app.js";
import connectDb from "./db/connectDb.js";
import { ConnectRedis } from "./db/Redis.js";

const required = [
   "MONGODB_URI",
   "ACCESS_TOKEN_SECRET",
   "REFRESH_TOKEN_SECRET",
   "CORS_ORIGIN",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
   console.error(`Missing required environment variables: ${missing.join(", ")}`);
   process.exit(1);
}

await connectDb();
await ConnectRedis();

const port = process.env.PORT || 8000;
app.listen(port, () => {
   console.log(`server Started at http://localhost:${port}`);
});
