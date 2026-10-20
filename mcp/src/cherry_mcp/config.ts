import "dotenv/config";
import { z } from "zod";

const schema = z.object({
    INTERNAL_API_KEY: z.string().min(1, "INTERNAL_API_KEY is required"),
    API_BASE_URL: z.string().default("http://127.0.0.1:4001/v1"),
});

export const config = schema.parse(process.env);
