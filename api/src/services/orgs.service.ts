import { Organization } from "../db/model/organizations.model.js";
import { OrgEdition } from "../db/model/orgEdition.model.js";
import { OrgSearchParams, PaginationResult } from "../types/api.type.js";

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

export class OrgsService {
    public static async searchOrgs(params: OrgSearchParams) {
        const page = Math.max(1, Number(params.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
        const skip = (page - 1) * limit;

        const techs = parseArrayParam(params.tech || params.technologies);
        const topics = parseArrayParam(params.topic || params.topics);
        const category = (params.category || "").trim();
        const text = (params.text || params.q || params.search || "").trim();
        const match = params.match === "all" ? "all" : "any";

        const singleYear = params.year ? Number(params.year) : undefined;
        const startYear =
            params.year_start !== undefined
                ? Number(params.year_start)
                : params.start_year !== undefined
                ? Number(params.start_year)
                : params.min_year !== undefined
                ? Number(params.min_year)
                : undefined;
        const endYear =
            params.year_end !== undefined
                ? Number(params.year_end)
                : params.end_year !== undefined
                ? Number(params.end_year)
                : params.max_year !== undefined
                ? Number(params.max_year)
                : undefined;

        const conditions: any[] = [];

        // Technology filters
        if (techs.length > 0) {
            if (match === "all") {
                // Must match every specified technology
                const techConditions = techs.map((t) => ({
                    technologies: { $regex: new RegExp(`^${escapeRegex(t)}$`, "i") },
                }));
                conditions.push({ $and: techConditions });
            } else {
                // Matches any specified technology
                const techRegexes = techs.map((t) => new RegExp(`^${escapeRegex(t)}$`, "i"));
                conditions.push({ technologies: { $in: techRegexes } });
            }
        }

        // Topic filters
        if (topics.length > 0) {
            if (match === "all") {
                const topicConditions = topics.map((t) => ({
                    topics: { $regex: new RegExp(`^${escapeRegex(t)}$`, "i") },
                }));
                conditions.push({ $and: topicConditions });
            } else {
                const topicRegexes = topics.map((t) => new RegExp(`^${escapeRegex(t)}$`, "i"));
                conditions.push({ topics: { $in: topicRegexes } });
            }
        }

        // Category filter
        if (category) {
            conditions.push({
                categories: { $regex: new RegExp(escapeRegex(category), "i") },
            });
        }

        // Year / Year range filters
        if (singleYear !== undefined && !isNaN(singleYear)) {
            conditions.push({ years_participated: singleYear });
        } else if (startYear !== undefined || endYear !== undefined) {
            const yearClause: any = {};
            if (startYear !== undefined && !isNaN(startYear)) yearClause.$gte = startYear;
            if (endYear !== undefined && !isNaN(endYear)) yearClause.$lte = endYear;
            conditions.push({
                years_participated: { $elemMatch: yearClause },
            });
        }

        // Text search across organizationName and description
        if (text) {
            const escapedText = escapeRegex(text);
            conditions.push({
                $or: [
                    { organizationName: { $regex: escapedText, $options: "i" } },
                    { description: { $regex: escapedText, $options: "i" } },
                ],
            });
        }

        // Combine based on match mode
        let query: any = {};
        if (conditions.length > 0) {
            if (match === "all") {
                query = { $and: conditions };
            } else {
                query = { $or: conditions };
            }
        }

        // Sorting
        let sortOption: any = { organizationName: 1 };
        if (params.sort) {
            switch (params.sort) {
                case "-name":
                    sortOption = { organizationName: -1 };
                    break;
                case "name":
                    sortOption = { organizationName: 1 };
                    break;
                case "recent":
                case "-recent":
                    sortOption = { "years_participated.0": -1 };
                    break;
                case "projects":
                case "-projects":
                    sortOption = { total_projects: -1 };
                    break;
                default:
                    sortOption = { organizationName: 1 };
            }
        }

        const [total, orgs] = await Promise.all([
            Organization.countDocuments(query),
            Organization.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
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

        const data = orgs.map((org: any) => ({
            id: String(org._id),
            slug: org.slug,
            name: org.organizationName,
            url: org.url,
            image_url: org.image_url,
            image_background_color: org.image_background_color,
            description: org.description,
            categories: org.categories || [],
            topics: org.topics || [],
            technologies: org.technologies || [],
            years_participated: org.years_participated || [],
            total_projects: org.total_projects || 0,
            contact: {
                irc_channel: org.irc_channel,
                contact_email: org.contact_email,
                mailing_list: org.mailing_list,
                guide_url: org.guide_url,
                ideas_url: org.ideas_url,
                twitter_url: org.twitter_url,
                blog_url: org.blog_url,
            },
        }));

        return { data, pagination };
    }

    public static async getOrgBySlug(slug: string) {
        const cleanSlug = slug.trim().toLowerCase();
        const org: any = await Organization.findOne({
            $or: [{ slug: cleanSlug }, { source_id: cleanSlug }],
        }).lean();

        if (!org) {
            return null;
        }

        // Fetch editions with projects populated
        const editions = await OrgEdition.find({ organization: org._id })
            .sort({ year: -1 })
            .populate({
                path: "projects",
                select: "title short_description student_name code_url project_url year",
            })
            .lean();

        const formattedEditions = editions.map((ed: any) => ({
            id: String(ed._id),
            source_id: ed.source_id,
            year: ed.year,
            category: ed.category,
            topics: ed.topics || [],
            technologies: ed.technologies || [],
            num_projects: ed.num_projects || ed.projects?.length || 0,
            projects: (ed.projects || []).map((p: any) => ({
                id: String(p._id),
                title: p.title,
                short_description: p.short_description,
                student_name: p.student_name,
                code_url: p.code_url,
                project_url: p.project_url,
            })),
        }));

        return {
            id: String(org._id),
            slug: org.slug,
            name: org.organizationName,
            url: org.url,
            image_url: org.image_url,
            image_background_color: org.image_background_color,
            description: org.description,
            categories: org.categories || [],
            topics: org.topics || [],
            technologies: org.technologies || [],
            years_participated: org.years_participated || [],
            total_projects: org.total_projects || 0,
            contact: {
                irc_channel: org.irc_channel,
                contact_email: org.contact_email,
                mailing_list: org.mailing_list,
                guide_url: org.guide_url,
                ideas_url: org.ideas_url,
                twitter_url: org.twitter_url,
                blog_url: org.blog_url,
            },
            editions: formattedEditions,
        };
    }

    public static async compareOrgs(slugs: string[]) {
        const cleanSlugs = slugs.map((s) => s.trim().toLowerCase()).filter(Boolean);

        if (cleanSlugs.length < 2 || cleanSlugs.length > 3) {
            throw new Error("Must provide between 2 and 3 organization slugs to compare.");
        }

        const orgs: any[] = await Organization.find({
            slug: { $in: cleanSlugs },
        }).lean();

        // Check if any slug was not found
        const foundSlugs = new Set(orgs.map((o) => o.slug));
        const missing = cleanSlugs.filter((s) => !foundSlugs.has(s));
        if (missing.length > 0) {
            throw new Error(`Organizations not found: ${missing.join(", ")}`);
        }

        // Fetch editions for all matched orgs
        const orgIds = orgs.map((o) => o._id);
        const editions = await OrgEdition.find({ organization: { $in: orgIds } })
            .sort({ year: -1 })
            .lean();

        const editionsByOrg = new Map<string, any[]>();
        editions.forEach((ed: any) => {
            const orgKey = String(ed.organization);
            if (!editionsByOrg.has(orgKey)) {
                editionsByOrg.set(orgKey, []);
            }
            editionsByOrg.get(orgKey)!.push(ed);
        });

        // Compute comparison metrics
        const orgSummaries = orgs.map((org) => {
            const orgEditions = editionsByOrg.get(String(org._id)) || [];
            const years = org.years_participated || [];
            const mostRecentYear = years.length > 0 ? Math.max(...years) : null;

            return {
                id: String(org._id),
                slug: org.slug,
                name: org.organizationName,
                url: org.url,
                image_url: org.image_url,
                description: org.description,
                categories: org.categories || [],
                technologies: org.technologies || [],
                topics: org.topics || [],
                years_count: years.length,
                years_participated: years,
                most_recent_year: mostRecentYear,
                total_projects: org.total_projects || 0,
                contact: {
                    irc_channel: org.irc_channel,
                    contact_email: org.contact_email,
                    mailing_list: org.mailing_list,
                    guide_url: org.guide_url,
                    ideas_url: org.ideas_url,
                    twitter_url: org.twitter_url,
                    blog_url: org.blog_url,
                },
                editions_summary: orgEditions.map((e) => ({
                    year: e.year,
                    category: e.category,
                    num_projects: e.num_projects,
                    technologies: e.technologies || [],
                })),
            };
        });

        // Common technologies intersection
        let commonTechs: string[] = orgSummaries[0]?.technologies || [];
        for (let i = 1; i < orgSummaries.length; i++) {
            const currentTechs = new Set(orgSummaries[i].technologies);
            commonTechs = commonTechs.filter((t: string) => currentTechs.has(t));
        }

        // Common topics intersection
        let commonTopics: string[] = orgSummaries[0]?.topics || [];
        for (let i = 1; i < orgSummaries.length; i++) {
            const currentTopics = new Set(orgSummaries[i].topics);
            commonTopics = commonTopics.filter((t: string) => currentTopics.has(t));
        }

        // Participation overlap (years in which all compared orgs participated)
        let commonYears: number[] = orgSummaries[0]?.years_participated || [];
        for (let i = 1; i < orgSummaries.length; i++) {
            const currentYears = new Set(orgSummaries[i].years_participated);
            commonYears = commonYears.filter((y: number) => currentYears.has(y));
        }

        const allTechnologies: Record<string, string[]> = {};
        const allTopics: Record<string, string[]> = {};
        const latestYears: Record<string, number | null> = {};
        const totalProjects: Record<string, number> = {};

        orgSummaries.forEach((org) => {
            allTechnologies[org.slug] = org.technologies;
            allTopics[org.slug] = org.topics;
            latestYears[org.slug] = org.most_recent_year;
            totalProjects[org.slug] = org.total_projects;
        });

        return {
            organizations: orgSummaries,
            side_by_side: {
                common_technologies: commonTechs,
                all_technologies: allTechnologies,
                common_topics: commonTopics,
                all_topics: allTopics,
                participation_overlap: commonYears,
                latest_year: latestYears,
                total_projects: totalProjects,
            },
        };
    }
}
