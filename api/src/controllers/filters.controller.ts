import { Request, Response, NextFunction } from "express";
import { FiltersService } from "../services/filters.service.js";

export class FiltersController {
    public static async getFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const refresh = req.query.refresh === "true" || req.query.refresh === "1";
            const filters = await FiltersService.getFilterOptions(refresh);
            res.status(200).json({
                success: true,
                data: filters,
            });
        } catch (error) {
            next(error);
        }
    }
}
