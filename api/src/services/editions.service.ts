import { Types } from "mongoose";
import { OrgEdition } from "../db/model/orgEdition.model.js";
import { Organization } from "../db/model/organizations.model.js";
import { EditionQueryParams, PaginationResult } from "../types/api.type.js";

function escapeRegex(text: string): string {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function parseArrayParam(param?: string | string[]): string[] {
    if (!param) return [];
    if (Array.isArray(param)) {
        return param.flatMap((p) => p.split(",")).map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    return param.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export class EditionsService {
    public static async listEditions(params: EditionQueryParams) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip = (page - 1) * limit;

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
                    // Non-existent org identifier produces empty results
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

        // Filter by year
        if (params.year !== undefined && !isNaN(Number(params.year))) {
            query.year = Number(params.year);
        }

        // Filter by tech
        const techs = parseArrayParam(params.tech || params.technology);
        if (techs.length > 0) {
            const techRegexes = techs.map((t) => new RegExp(`^${escapeRegex(t)}$`, "i"));
            query.technologies = { $in: techRegexes };
        }

        // Filter by topic
        const topics = parseArrayParam(params.topic);
        if (topics.length > 0) {
            const topicRegexes = topics.map((t) => new RegExp(`^${escapeRegex(t)}$`, "i"));
            query.topics = { $in: topicRegexes };
        }

        // Filter by category
        if (params.category && params.category.trim()) {
            query.category = { $regex: new RegExp(escapeRegex(params.category.trim()), "i") };
        }

        const [total, editions] = await Promise.all([
            OrgEdition.countDocuments(query),
            OrgEdition.find(query)
                .sort({ year: -1 })
                .skip(skip)
                .limit(limit)
                .populate("organization", "slug organizationName url image_url")
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

        const data = editions.map((ed: any) => {
            const org = ed.organization || {};
            return {
                id: String(ed._id),
                source_id: ed.source_id,
                year: ed.year,
                category: ed.category,
                topics: ed.topics || [],
                technologies: ed.technologies || [],
                num_projects: ed.num_projects || 0,
                projects_count: Array.isArray(ed.projects) ? ed.projects.length : 0,
                organization: {
                    id: String(org._id || ""),
                    slug: org.slug || null,
                    name: org.organizationName || null,
                    url: org.url || null,
                    image_url: org.image_url || null,
                },
            };
        });

        return { data, pagination };
    }
}
