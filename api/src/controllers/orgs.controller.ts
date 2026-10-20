import { Request, Response, NextFunction } from "express";
import { OrgsService } from "../services/orgs.service.js";
import { orgSearchQuerySchema, compareOrgsQuerySchema } from "../validators/schemas.js";

export class OrgsController {
    public static async searchOrgs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsedQuery = orgSearchQuerySchema.parse(req.query);
            const result = await OrgsService.searchOrgs(parsedQuery);
            res.status(200).json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getOrgBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { slug } = req.params;
            if (!slug) {
                res.status(400).json({ success: false, error: "Organization slug is required" });
                return;
            }

            const org = await OrgsService.getOrgBySlug(slug);
            if (!org) {
                res.status(404).json({
                    success: false,
                    error: `Organization not found with slug: ${slug}`,
                });
                return;
            }

            res.status(200).json({
                success: true,
                data: org,
            });
        } catch (error) {
            next(error);
        }
    }

    public static async compareOrgs(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Support slugs from query string or request body
            const slugsInput = req.query.slugs || req.body?.slugs;
            const parsed = compareOrgsQuerySchema.parse({ slugs: slugsInput });

            const slugsList = Array.isArray(parsed.slugs)
                ? parsed.slugs
                : parsed.slugs.split(",").map((s) => s.trim()).filter(Boolean);

            const result = await OrgsService.compareOrgs(slugsList);
            res.status(200).json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
