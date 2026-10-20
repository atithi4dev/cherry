import { Request, Response, NextFunction } from "express";
import { ProjectsService } from "../services/projects.service.js";
import { projectQuerySchema } from "../validators/schemas.js";

export class ProjectsController {
    public static async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rawQuery = { ...req.query };
            // If mounted under /orgs/:slug/projects, attach slug to query
            if (req.params.slug) {
                rawQuery.slug = req.params.slug;
            }

            const parsedQuery = projectQuerySchema.parse(rawQuery);
            const result = await ProjectsService.listProjects(parsedQuery);
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }
}
