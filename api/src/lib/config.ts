import "dotenv/config";
import {z} from "zod";

const schema = z.object({
    NODE_ENV: z.string().default("development"),
    API_HOST: z.string().default("127.0.0.1"),
    API_PORT: z.coerce.number().default(4001),
    DATABASE_URL: z.string(),
    REDIS_URL: z.string(),
    INTERNAL_API_KEY: z.string().min(32),
    TOKEN_ENCRYPTION_KEY: z.string().optional(),
    TOKEN_EXPIRY_TIME: z.coerce.number().default(7),
    MONGO_CONN_STRING: z.string()
});

export const config = schema.parse(process.env);