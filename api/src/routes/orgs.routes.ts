import { Router } from "express";
import { OrgsController } from "../controllers/orgs.controller.js";
import { EditionsController } from "../controllers/editions.controller.js";
import { ProjectsController } from "../controllers/projects.controller.js";

const router = Router();

// Compare organizations side by side (Must be declared before /:slug so "compare" is not treated as a slug)
router.get("/compare", OrgsController.compareOrgs);
router.post("/compare", OrgsController.compareOrgs);

// Search organizations
router.get("/", OrgsController.searchOrgs);

// Get one organization by slug with its editions
router.get("/:slug", OrgsController.getOrgBySlug);

// Nested helper routes for convenience
router.get("/:slug/editions", EditionsController.listEditions);
router.get("/:slug/projects", ProjectsController.listProjects);

export default router;
