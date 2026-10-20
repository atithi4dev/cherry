import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./cherry_mcp/tools.js";

const server = new McpServer({
    name: "cherry-mcp",
    version: "1.0.0",
    description:
        "Cherry MCP server — GSoC contribution coaching. Connects to the Cherry API " +
        "(http://127.0.0.1:4001/v1) to search organizations, view org details/editions/projects, " +
        "compare orgs, and list filter options.",
});

registerTools(server);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Cherry MCP server running on stdio");
}

main().catch((err) => {
    console.error("Failed to start MCP server:", err);
    process.exit(1);
});
