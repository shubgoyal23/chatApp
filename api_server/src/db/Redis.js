import { createClient } from "redis";

export let Redisclient; // Holds the Redis Redisclient instance
let isConnectedRedis = false; // Tracks the connection status

// Prepends REDIS_PREFIX so several apps can share one Redis.
// Must match the socket server's REDIS_PREFIX, since both read the same keys.
export const redisKey = (key) => `${process.env.REDIS_PREFIX ?? ""}${key}`;

export const ConnectRedis = async () => {
    if (isConnectedRedis && Redisclient) return;

    // Create a new Redis Redisclient instance
    Redisclient = createClient({
        url: `redis://${process.env.REDIS_HOST}`,
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
    });
    
    // Handle errors (important for serverless)
    Redisclient.on("error", (err) => {
        console.error("Redis Client Error", err);
        isConnectedRedis = false;
    });

    // Connect to Redis
    await Redisclient.connect();

    // Verify connection
    const val = await Redisclient.ping();
    if (val === "PONG") {
        isConnectedRedis = true;
        console.log("Connected to Redis");
    } else {
        throw new Error("Failed to connect to Redis");
    }
    return;
};