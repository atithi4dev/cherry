import { z } from "zod";

export const orgSearchQuerySchema = z.object({
    tech: z.union([z.string(), z.array(z.string())]).optional(),
    technologies: z.union([z.string(), z.array(z.string())]).optional(),
    topic: z.union([z.string(), z.array(z.string())]).optional(),
    topics: z.union([z.string(), z.array(z.string())]).optional(),
    category: z.string().optional(),
    year: z.coerce.number().int().optional(),
    year_start: z.coerce.number().int().optional(),
    year_end: z.coerce.number().int().optional(),
    min_year: z.coerce.number().int().optional(),
    max_year: z.coerce.number().int().optional(),
    start_year: z.coerce.number().int().optional(),
    end_year: z.coerce.number().int().optional(),
    text: z.string().optional(),
    q: z.string().optional(),
    search: z.string().optional(),
    match: z.enum(["any", "all"]).default("any"),
    sort: z.string().default("name"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const editionQuerySchema = z.object({
    org: z.string().optional(),
    orgSlug: z.string().optional(),
    slug: z.string().optional(),
    year: z.coerce.number().int().optional(),
    tech: z.union([z.string(), z.array(z.string())]).optional(),
    technology: z.union([z.string(), z.array(z.string())]).optional(),
    topic: z.union([z.string(), z.array(z.string())]).optional(),
    category: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const projectQuerySchema = z.object({
    org: z.string().optional(),
    orgSlug: z.string().optional(),
    slug: z.string().optional(),
    year: z.coerce.number().int().optional(),
    year_start: z.coerce.number().int().optional(),
    year_end: z.coerce.number().int().optional(),
    start_year: z.coerce.number().int().optional(),
    end_year: z.coerce.number().int().optional(),
    text: z.string().optional(),
    q: z.string().optional(),
    search: z.string().optional(),
    full: z
        .union([z.boolean(), z.string(), z.number()])
        .optional()
        .transform((val) => {
            if (typeof val === "boolean") return val;
            if (typeof val === "string") return val === "true" || val === "1";
            if (typeof val === "number") return val === 1;
            return false;
        }),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const compareOrgsQuerySchema = z.object({
    slugs: z.union([z.string(), z.array(z.string())]).refine(
        (val) => {
            const list = Array.isArray(val) ? val : val.split(",").map((s) => s.trim()).filter(Boolean);
            return list.length >= 2 && list.length <= 3;
        },
        {
            message: "Must provide between 2 and 3 organization slugs to compare (e.g. slugs=org1,org2 or slugs=org1,org2,org3)",
        }
    ),
});
