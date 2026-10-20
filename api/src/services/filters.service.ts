import { cache } from "../lib/cache.js";
import { Organization } from "../db/model/organizations.model.js";
import { OrgEdition } from "../db/model/orgEdition.model.js";
import { Project } from "../db/model/projects.model.js";

export interface FilterOptionsResult {
    technologies: string[];
    topics: string[];
    categories: string[];
    years: number[];
    counts: {
        total_organizations: number;
        total_editions: number;
        total_projects: number;
        total_technologies: number;
        total_topics: number;
        total_categories: number;
    };
}

const CACHE_KEY = "gsoc:filter-options";
const CACHE_TTL_SECONDS = 3600; // 1 hour

export class FiltersService {
    public static async getFilterOptions(refresh: boolean = false): Promise<FilterOptionsResult> {
        if (!refresh) {
            const cached = await cache.get<FilterOptionsResult>(CACHE_KEY);
            if (cached) {
                return cached;
            }
        }

        const [
            rawTechs,
            rawTopics,
            rawCategories,
            rawYears,
            totalOrgs,
            totalEditions,
            totalProjects,
        ] = await Promise.all([
            OrgEdition.distinct("technologies"),
            OrgEdition.distinct("topics"),
            OrgEdition.distinct("category"),
            OrgEdition.distinct("year"),
            Organization.countDocuments(),
            OrgEdition.countDocuments(),
            Project.countDocuments(),
        ]);

        const technologies = (rawTechs as string[])
            .filter((t) => Boolean(t && typeof t === "string" && t.trim().length > 0))
            .map((t) => t.trim().toLowerCase())
            .filter((t, idx, self) => self.indexOf(t) === idx)
            .sort((a, b) => a.localeCompare(b));

        const topics = (rawTopics as string[])
            .filter((t) => Boolean(t && typeof t === "string" && t.trim().length > 0))
            .map((t) => t.trim().toLowerCase())
            .filter((t, idx, self) => self.indexOf(t) === idx)
            .sort((a, b) => a.localeCompare(b));

        const categories = (rawCategories as string[])
            .filter((c) => Boolean(c && typeof c === "string" && c.trim().length > 0))
            .map((c) => c.trim())
            .filter((c, idx, self) => self.indexOf(c) === idx)
            .sort((a, b) => a.localeCompare(b));

        const years = (rawYears as number[])
            .filter((y) => typeof y === "number" && !isNaN(y))
            .sort((a, b) => b - a);

        const result: FilterOptionsResult = {
            technologies,
            topics,
            categories,
            years,
            counts: {
                total_organizations: totalOrgs,
                total_editions: totalEditions,
                total_projects: totalProjects,
                total_technologies: technologies.length,
                total_topics: topics.length,
                total_categories: categories.length,
            },
        };

        await cache.set(CACHE_KEY, result, CACHE_TTL_SECONDS);
        return result;
    }
}
