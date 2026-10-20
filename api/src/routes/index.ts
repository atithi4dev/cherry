import { Router } from "express";
import orgsRouter from "./orgs.routes.js";
import editionsRouter from "./editions.routes.js";
import projectsRouter from "./projects.routes.js";
import filtersRouter from "./filters.routes.js";

const router = Router();

// Ping endpoint
router.get("/ping", (req, res) => {
    res.json({
        pong: "true",
        requestId: req.header("x-request-id") ?? null,
    });
});

// Resource routes
router.use("/orgs", orgsRouter);
router.use("/editions", editionsRouter);
router.use("/projects", projectsRouter);
router.use("/filters", filtersRouter);
router.use("/filter-options", filtersRouter);

export default router;
