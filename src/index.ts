#!/usr/bin/env node

/**
 * Black Duck MCP Server
 * Model Context Protocol server for Black Duck vulnerability management
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOLS } from "./tools/config.js";

/**
 * Create and configure the MCP server
 */
async function main() {
  const server = new McpServer({
    name: "blackduck-mcp-server",
    version: "1.0.0",
  });

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        try {
          const result = await tool.handler(args);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return {
            content: [
              {
                type: "text",
                text: `Error fetching result: ${message}`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Black Duck MCP Server running on stdio");
}

// Run the server
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
