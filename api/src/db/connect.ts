import mongoose from "mongoose";
import { config } from "../lib/config.js";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export const connectDB = async (): Promise<typeof mongoose> => {
    if (mongoose.connection.readyState === 1) {
        return mongoose;
    }
    return await retryDbCall();
};

async function retryDbCall(): Promise<typeof mongoose> {
    const mongoURI = config.MONGO_CONN_STRING || process.env.MONGO_CONN_STRING || "mongodb://localhost:27017/cherry";
    let curRetry = 0;

    while (curRetry < MAX_RETRIES) {
        try {
            const conn = await mongoose.connect(mongoURI);
            console.log("Successfully connected to MongoDB");
            return conn;
        } catch (error) {
            curRetry++;
            console.error(`Error connecting to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
            console.log(`MongoConnection retry = ${curRetry}/${MAX_RETRIES}`);
            if (curRetry >= MAX_RETRIES) {
                break;
            }
            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    resolve();
                }, RETRY_DELAY_MS);
            });
        }
    }

    console.error("Max retries for MongoDB achieved. Exiting...");
    process.exit(1);
}