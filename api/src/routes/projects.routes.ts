import { Router } from "express";
import { ProjectsController } from "../controllers/projects.controller.js";

const router = Router();

// List projects filtered by org, year range, text search, full description option
router.get("/", ProjectsController.listProjects);

export default router;
