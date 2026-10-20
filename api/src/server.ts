import express from "express";
import pg from "pg";
import { Redis } from "ioredis";
import { config } from "./lib/config.js";
import { error } from "node:console";
import { connectDB } from "./db/connect.js";


// const db = new pg.Pool({ connectionString: config.DATABASE_URL });
const redis = new Redis(config.REDIS_URL);

const app = express();

connectDB();

app.use(express.json());


// app.get("/health", async (_req, res) => {
//     try {
//         await db.query("SELECT 1");
//         await redis.ping();

//         res.json({ ok: true });
//     } catch (e) {
//         res.status(500).json({
//             ok: false,
//             error: String(e)
//         })
//     }
// })

// everything under /v1 requires the shared secret
app.use("/v1", (req, res, next) => {
    if (req.header("x-internal-key") !== config.INTERNAL_API_KEY) {   // later will use crypto.timingSafeEqual
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
})

app.get("/v1/ping", (req, res) => {
    res.json({
        pong: "true",
        requestId: req.header("x-request-id") ?? null
    })
})


app.listen(config.API_PORT, config.API_HOST, () => {
    console.log("TEST 1");
    console.log("Mongo config exists:", Boolean(config.MONGO_CONN_STRING));
    console.log("TEST 2");
    console.log(`api on http://${config.API_HOST}:${config.API_PORT}`);
});