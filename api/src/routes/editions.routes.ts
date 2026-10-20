import { Router } from "express";
import { EditionsController } from "../controllers/editions.controller.js";

const router = Router();

// List editions filtered by org, year, tech, topic, category
router.get("/", EditionsController.listEditions);

export default router;
