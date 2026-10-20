import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerTools } from "./cherry_mcp/tools.js";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  // Stateless: new server + transport per request
  const server = new McpServer({ name: "cherry-mcp", version: "1.0.0" });
  registerTools(server);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3000, () => {
  console.error("Cherry MCP listening on http://localhost:3000/mcp");
});