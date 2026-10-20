import { Request, Response, NextFunction } from "express";
import { EditionsService } from "../services/editions.service.js";
import { editionQuerySchema } from "../validators/schemas.js";

export class EditionsController {
    public static async listEditions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rawQuery = { ...req.query };
            // If mounted under /orgs/:slug/editions, attach slug to query
            if (req.params.slug) {
                rawQuery.slug = req.params.slug;
            }

            const parsedQuery = editionQuerySchema.parse(rawQuery);
            const result = await EditionsService.listEditions(parsedQuery);
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
