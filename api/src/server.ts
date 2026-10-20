import express from "express";
import mongoose from "mongoose";
import { config } from "./lib/config.js";
import { connectDB } from "./db/connect.js";
import { requireInternalKey } from "./middleware/auth.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import v1Router from "./routes/index.js";

const app = express();

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Public health check route
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});

// Protect all /v1 endpoints with shared internal secret
app.use("/v1", requireInternalKey);

// Mount /v1 API routes
app.use("/v1", v1Router);

// Error and 404 middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Start server after connecting to database
async function startServer() {
    try {
        await connectDB();
        app.listen(config.API_PORT, config.API_HOST, () => {
            console.log(`API server listening on http://${config.API_HOST}:${config.API_PORT}`);
            console.log(`Health endpoint: http://${config.API_HOST}:${config.API_PORT}/health`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

export default app;