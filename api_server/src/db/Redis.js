import { createClient } from "redis";

export let Redisclient; // Holds the Redis Redisclient instance
let isConnectedRedis = false; // Tracks the connection status

export const ConnectRedis = async () => {
    if (isConnectedRedis && Redisclient) return; 

    // Create a new Redis Redisclient instance
    Redisclient = createClient({
        url: `redis://default:${process.env.REDIS_PWD}@${process.env.REDIS_HOST}`,
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