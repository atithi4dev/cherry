import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { api } from "./api.js";

export function registerTools(server: McpServer) {
    server.tool(
        "search_orgs",
        "Search GSoC organizations by technology, topic, category, year, or keyword.",
        {
            tech: z
                .string()
                .optional()
                .describe("Comma-separated technologies (e.g. python, django, docker)"),
            topic: z.string().optional().describe("Comma-separated topics"),
            category: z.string().optional().describe("Organization category"),
            year: z.coerce.number().int().optional().describe("Participation year"),
            text: z.string().optional().describe("Keyword search in name/description"),
            match: z.enum(["any", "all"]).default("any").describe("Match mode for filters"),
            sort: z.string().default("name").describe("Sort: name, -name, recent, projects"),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
        },
        async (args) => {
            const result = await api.searchOrg(args as any);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    );

    server.tool(
        "get_org",
        "Get a single organization by slug, including its editions and projects.",
        {
            slug: z.string().describe("Organization slug (e.g. apache-beam, tensorflow)"),
        },
        async (args) => {
            const result = await api.getOrg(args.slug);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    );

    server.tool(
        "compare_orgs",
        "Compare 2-3 organizations side by side (technologies, topics, years, projects).",
        {
            slugs: z
                .string()
                .describe("Comma-separated organization slugs (2-3), e.g. org1,org2"),
        },
        async (args) => {
            const slugs = args.slugs.split(",").map((s) => s.trim()).filter(Boolean);
            const result = await api.compareOrgs(slugs);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    );

    server.tool(
        "list_editions",
        "List organization editions (participation years) with filters.",
        {
            org: z.string().optional().describe("Organization slug"),
            year: z.coerce.number().int().optional().describe("Filter by year"),
            tech: z.string().optional().describe("Comma-separated technologies"),
            topic: z.string().optional().describe("Comma-separated topics"),
            category: z.string().optional().describe("Category"),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
        },
        async (args) => {
            const result = await api.listEditions(args as any);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    );

    server.tool(
        "list_projects",
        "List GSoC projects filtered by org, year range, or keyword search.",
        {
            org: z.string().optional().describe("Organization slug"),
            year: z.coerce.number().int().optional().describe("Year"),
            year_start: z.coerce.number().int().optional().describe("Start year"),
            year_end: z.coerce.number().int().optional().describe("End year"),
            text: z.string().optional().describe("Keyword search"),
            full: z.boolean().optional().default(false).describe("Include full description"),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
        },
        async (args) => {
            const result = await api.listProjects(args as any);
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    );

    server.tool(
        "get_filters",
        "List available filter options: technologies, topics, categories, years.",
        {},
        async () => {
            const result = await api.getFilters();
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    );

    server.tool(
        "ping_api",
        "Check that the Cherry API is reachable.",
        {},
        async () => {
            const result = await api.ping();
            return {
                content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            };
        }
    );
}
