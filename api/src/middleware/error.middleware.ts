import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ZodError) {
        const issues = (err.issues || (err as any).errors || []).map((issue: any) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
        res.status(400).json({
            success: false,
            error: "Validation Error",
            details: issues,
        });
        return;
    }

    const message = err instanceof Error ? err.message : String(err);
    const statusCode = err.status || err.statusCode || 500;

    console.error(`[Error] ${req.method} ${req.url}:`, message);

    res.status(statusCode).json({
        success: false,
        error: message,
    });
};

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
};
