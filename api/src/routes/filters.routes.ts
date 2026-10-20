import { Router } from "express";
import { FiltersController } from "../controllers/filters.controller.js";

const router = Router();

// Filter options: list all known technologies, topics, categories, and years
router.get("/", FiltersController.getFilters);

export default router;
