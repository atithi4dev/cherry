import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Types } from "mongoose";
import { connectDB } from "./connect.js";
import { Organization } from "./model/organizations.model.js";
import { OrgEdition } from "./model/orgEdition.model.js";
import { Project } from "./model/projects.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function slugify(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

interface RawProject {
    title?: string;
    short_description?: string;
    description?: string;
    student_name?: string;
    code_url?: string;
    project_url?: string;
}

interface RawYearData {
    projects_url?: string;
    num_projects?: number;
    projects?: RawProject[];
}

interface RawOrg {
    name: string;
    url?: string;
    image_url?: string;
    image_background_color?: string;
    description?: string;
    category?: string;
    topics?: string[];
    technologies?: string[];
    years?: Record<string, RawYearData>;
    irc_channel?: string;
    contact_email?: string;
    mailing_list?: string;
    ideas_url?: string;
    guide_url?: string;
    twitter_url?: string;
    blog_url?: string;
}

interface RawYearPayloadOrg {
    name: string;
    category?: string;
    topics?: string[];
    technologies?: string[];
    num_projects?: number;
    projects?: RawProject[];
    irc_channel?: string;
    contact_email?: string;
    mailing_list?: string;
    twitter_url?: string;
    blog_url?: string;
}

interface RawYearPayload {
    year: number;
    organizations: RawYearPayloadOrg[];
}

export async function seedDatabase(force: boolean = false) {
    await connectDB();

    const existingCount = await Organization.countDocuments();
    if (existingCount > 0 && !force) {
        console.log(`Database already contains ${existingCount} organizations. Skipping seed (use --force to re-seed).`);
        return;
    }

    if (force) {
        console.log("Force flag detected. Clearing existing organizations, editions, and projects...");
        try {
            await Promise.all([
                Organization.deleteMany({}),
                OrgEdition.deleteMany({}),
                Project.deleteMany({}),
            ]);
            console.log("Existing collections cleared.");
        } catch (err) {
            console.warn("Notice during clear:", err);
        }
    }

    // Paths to data files
    const dataDir = path.resolve(__dirname, "../../data/gsoc_data_exporter_bundle/gsoc-data");
    const orgsJsonPath = path.join(dataDir, "organizations.json");
    const byYearDir = path.join(dataDir, "by_year");

    if (!fs.existsSync(orgsJsonPath)) {
        throw new Error(`Data file not found at ${orgsJsonPath}`);
    }

    console.log("Reading data files...");
    const rawOrgs: RawOrg[] = JSON.parse(fs.readFileSync(orgsJsonPath, "utf-8"));

    // Read by_year files for detailed year-specific metadata
    const yearlyMap = new Map<string, Map<number, RawYearPayloadOrg>>();
    if (fs.existsSync(byYearDir)) {
        const yearFiles = fs.readdirSync(byYearDir).filter((f) => f.endsWith(".json"));
        for (const file of yearFiles) {
            try {
                const yearData: RawYearPayload = JSON.parse(fs.readFileSync(path.join(byYearDir, file), "utf-8"));
                const yearNum = yearData.year;
                for (const org of yearData.organizations || []) {
                    const normName = org.name.trim().toLowerCase();
                    if (!yearlyMap.has(normName)) {
                        yearlyMap.set(normName, new Map());
                    }
                    yearlyMap.get(normName)!.set(yearNum, org);
                }
            } catch (err) {
                console.warn(`Could not read ${file}:`, err);
            }
        }
    }

    console.log(`Processing ${rawOrgs.length} organizations...`);

    const orgDocsToInsert: any[] = [];
    const editionDocsToInsert: any[] = [];
    const projectDocsToInsert: any[] = [];

    const usedSlugs = new Set<string>();

    for (const rawOrg of rawOrgs) {
        let baseSlug = slugify(rawOrg.name || "unknown");
        let slug = baseSlug;
        let counter = 1;
        while (usedSlugs.has(slug)) {
            slug = `${baseSlug}-${counter++}`;
        }
        usedSlugs.add(slug);

        const orgId = new Types.ObjectId();
        const normName = (rawOrg.name || "").trim().toLowerCase();
        const yearSpecificDataMap = yearlyMap.get(normName);

        // Aggregate unique categories, topics, technologies, and years
        const categoriesSet = new Set<string>();
        if (rawOrg.category) categoriesSet.add(rawOrg.category.trim());

        const topicsSet = new Set<string>();
        (rawOrg.topics || []).forEach((t) => t && topicsSet.add(t.trim()));

        const technologiesSet = new Set<string>();
        (rawOrg.technologies || []).forEach((t) => t && technologiesSet.add(t.trim()));

        const yearsParticipatedSet = new Set<number>();
        const yearsMapObj: Record<string, Types.ObjectId> = {};
        let totalProjectsCount = 0;

        // Process all years from org.years and yearSpecificDataMap
        const allYears = new Set<string>();
        if (rawOrg.years) {
            Object.keys(rawOrg.years).forEach((y) => allYears.add(y));
        }
        if (yearSpecificDataMap) {
            yearSpecificDataMap.forEach((_, y) => allYears.add(String(y)));
        }

        for (const yearStr of allYears) {
            const yearNum = parseInt(yearStr, 10);
            if (isNaN(yearNum)) continue;

            yearsParticipatedSet.add(yearNum);
            const editionId = new Types.ObjectId();
            yearsMapObj[yearStr] = editionId;

            const yearDetails = rawOrg.years?.[yearStr];
            const yearSpecificOrg = yearSpecificDataMap?.get(yearNum);

            const category = yearSpecificOrg?.category || rawOrg.category || "General";
            if (category) categoriesSet.add(category.trim());

            const editionTopics = new Set<string>();
            (yearSpecificOrg?.topics || rawOrg.topics || []).forEach((t) => {
                if (t) {
                    const clean = t.trim();
                    editionTopics.add(clean);
                    topicsSet.add(clean);
                }
            });

            const editionTech = new Set<string>();
            (yearSpecificOrg?.technologies || rawOrg.technologies || []).forEach((t) => {
                if (t) {
                    const clean = t.trim();
                    editionTech.add(clean);
                    technologiesSet.add(clean);
                }
            });

            // Projects for this edition
            const rawProjects: RawProject[] =
                yearSpecificOrg?.projects || yearDetails?.projects || [];

            const projectIds: Types.ObjectId[] = [];

            rawProjects.forEach((proj, idx) => {
                if (!proj || !proj.title) return;
                const projId = new Types.ObjectId();
                projectIds.push(projId);

                projectDocsToInsert.push({
                    _id: projId,
                    source_id: proj.project_url || `${slug}-${yearNum}-${idx}`,
                    organization: orgId,
                    edition: editionId,
                    year: yearNum,
                    title: proj.title.trim(),
                    short_description: proj.short_description || null,
                    description: proj.description || null,
                    student_name: proj.student_name ? proj.student_name.trim() : null,
                    code_url: proj.code_url ? proj.code_url.trim() : null,
                    project_url: proj.project_url ? proj.project_url.trim() : null,
                });
            });

            totalProjectsCount += projectIds.length;

            editionDocsToInsert.push({
                _id: editionId,
                source_id: `${slug}-${yearNum}`,
                organization: orgId,
                year: yearNum,
                category: category ? category.trim() : null,
                topics: Array.from(editionTopics),
                technologies: Array.from(editionTech),
                num_projects: projectIds.length,
                projects: projectIds,
            });
        }

        const sortedYears = Array.from(yearsParticipatedSet).sort((a, b) => a - b);

        orgDocsToInsert.push({
            _id: orgId,
            source_id: slug,
            slug,
            organizationName: (rawOrg.name || "").trim(),
            url: rawOrg.url ? rawOrg.url.trim() : null,
            image_url: rawOrg.image_url ? rawOrg.image_url.trim() : null,
            image_background_color: rawOrg.image_background_color || null,
            description: rawOrg.description ? rawOrg.description.trim() : null,
            years: yearsMapObj,
            categories: Array.from(categoriesSet),
            topics: Array.from(topicsSet),
            technologies: Array.from(technologiesSet),
            years_participated: sortedYears,
            total_projects: totalProjectsCount,
            irc_channel: rawOrg.irc_channel ? rawOrg.irc_channel.trim() : null,
            contact_email: rawOrg.contact_email ? rawOrg.contact_email.trim() : null,
            mailing_list: rawOrg.mailing_list ? rawOrg.mailing_list.trim() : null,
            guide_url: rawOrg.guide_url ? rawOrg.guide_url.trim() : null,
            ideas_url: rawOrg.ideas_url ? rawOrg.ideas_url.trim() : null,
            twitter_url: rawOrg.twitter_url ? rawOrg.twitter_url.trim() : null,
            blog_url: rawOrg.blog_url ? rawOrg.blog_url.trim() : null,
        });
    }

    console.log(`Inserting ${orgDocsToInsert.length} organizations into MongoDB...`);
    await Organization.insertMany(orgDocsToInsert, { ordered: false });

    console.log(`Inserting ${editionDocsToInsert.length} editions into MongoDB...`);
    for (let i = 0; i < editionDocsToInsert.length; i += 1000) {
        await OrgEdition.insertMany(editionDocsToInsert.slice(i, i + 1000), { ordered: false });
    }

    console.log(`Inserting ${projectDocsToInsert.length} projects into MongoDB...`);
    for (let i = 0; i < projectDocsToInsert.length; i += 2000) {
        await Project.insertMany(projectDocsToInsert.slice(i, i + 2000), { ordered: false });
    }

    console.log("Database seeded successfully!");
    console.log(`Summary:`);
    console.log(`- Organizations: ${orgDocsToInsert.length}`);
    console.log(`- Editions: ${editionDocsToInsert.length}`);
    console.log(`- Projects: ${projectDocsToInsert.length}`);
}
