import { Request, Response, NextFunction } from "express";
import { config } from "../lib/config.js";

export const requireInternalKey = (req: Request, res: Response, next: NextFunction): void => {
    const providedKey = req.header("x-internal-key");
    if (!providedKey || providedKey !== config.INTERNAL_API_KEY) {
        res.status(401).json({
            success: false,
            error: "Unauthorized: Invalid or missing x-internal-key header",
        });
        return;
    }
    next();
};
