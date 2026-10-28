import { createClient } from "redis";

export let Redisclient; // Holds the Redis client instance

// Prepends REDIS_PREFIX so several apps can share one Redis.
// Must match the socket server's REDIS_PREFIX, since both read the same keys.
export const redisKey = (key) => `${process.env.REDIS_PREFIX ?? ""}${key}`;

// Connects once at startup; the client reconnects on its own after that.
export const ConnectRedis = async () => {
   if (Redisclient?.isOpen) return;

   Redisclient = createClient({
      url: `redis://${process.env.REDIS_HOST}`,
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
   });

   Redisclient.on("error", (err) => {
      console.error("Redis Client Error", err);
   });

   await Redisclient.connect();
   console.log("Connected to Redis");
};
