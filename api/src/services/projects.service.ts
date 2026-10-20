import { Types } from "mongoose";
import { Project } from "../db/model/projects.model.js";
import { Organization } from "../db/model/organizations.model.js";
import { ProjectQueryParams, PaginationResult } from "../types/api.type.js";

function escapeRegex(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export class ProjectsService {
    public static async listProjects(params: ProjectQueryParams) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip = (page - 1) * limit;

        const isFullDescription = Boolean(params.full);
        const query: any = {};

        // Filter by organization slug or ID
        const orgIdentifier = (params.org || params.orgSlug || params.slug || "").trim();
        if (orgIdentifier) {
            if (Types.ObjectId.isValid(orgIdentifier)) {
                query.organization = new Types.ObjectId(orgIdentifier);
            } else {
                const org = await Organization.findOne({
                    $or: [{ slug: orgIdentifier.toLowerCase() }, { source_id: orgIdentifier.toLowerCase() }],
                }).select("_id");
                if (org) {
                    query.organization = org._id;
                } else {
                    return {
                        data: [],
                        pagination: {
                            page,
                            limit,
                            total: 0,
                            totalPages: 0,
                            hasNext: false,
                            hasPrev: false,
                        },
                    };
                }
            }
        }

        // Filter by year / year range
        const singleYear = params.year !== undefined ? Number(params.year) : undefined;
        const startYear =
            params.year_start !== undefined
                ? Number(params.year_start)
                : params.start_year !== undefined
                ? Number(params.start_year)
                : undefined;
        const endYear =
            params.year_end !== undefined
                ? Number(params.year_end)
                : params.end_year !== undefined
                ? Number(params.end_year)
                : undefined;

        if (singleYear !== undefined && !isNaN(singleYear)) {
            query.year = singleYear;
        } else if (startYear !== undefined || endYear !== undefined) {
            query.year = {};
            if (startYear !== undefined && !isNaN(startYear)) query.year.$gte = startYear;
            if (endYear !== undefined && !isNaN(endYear)) query.year.$lte = endYear;
        }

        // Text search across title, short_description, description
        const text = (params.text || params.q || params.search || "").trim();
        if (text) {
            const escaped = escapeRegex(text);
            query.$or = [
                { title: { $regex: escaped, $options: "i" } },
                { short_description: { $regex: escaped, $options: "i" } },
                { description: { $regex: escaped, $options: "i" } },
            ];
        }

        // Projection: omit full description if not requested
        const projection = isFullDescription ? {} : { description: 0 };

        const [total, projects] = await Promise.all([
            Project.countDocuments(query),
            Project.find(query, projection)
                .sort({ year: -1, title: 1 })
                .skip(skip)
                .limit(limit)
                .populate("organization", "slug organizationName url image_url")
                .populate("edition", "category technologies topics")
                .lean(),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;
        const pagination: PaginationResult = {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };

        const data = projects.map((proj: any) => {
            const org = proj.organization || {};
            const edition = proj.edition || {};
            const baseObj: any = {
                id: String(proj._id),
                source_id: proj.source_id,
                year: proj.year,
                title: proj.title,
                short_description: proj.short_description,
                student_name: proj.student_name,
                code_url: proj.code_url,
                project_url: proj.project_url,
                organization: {
                    id: String(org._id || ""),
                    slug: org.slug || null,
                    name: org.organizationName || null,
                    url: org.url || null,
                    image_url: org.image_url || null,
                },
                edition: {
                    id: String(edition._id || ""),
                    category: edition.category || null,
                    technologies: edition.technologies || [],
                    topics: edition.topics || [],
                },
            };

            if (isFullDescription) {
                baseObj.description = proj.description;
            }

            return baseObj;
        });

        return { data, pagination };
    }
}
