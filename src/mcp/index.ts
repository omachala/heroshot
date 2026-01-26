/**
 * Heroshot MCP Server
 *
 * MCP server for screenshot automation. Tools are auto-derived from Zod schemas
 * using z.toJSONSchema() for low maintenance.
 */

// eslint-disable-next-line no-restricted-imports -- MCP SDK requires .js extension for ESM
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// eslint-disable-next-line no-restricted-imports -- MCP SDK requires .js extension for ESM
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { tools } from './tools/definitions';
import { toMcpTool } from './utils/zodToMcp';

const server = new McpServer({
  name: 'heroshot',
  version: '0.1.0',
});

// Register all tools - schemas auto-derived from Zod
for (const tool of tools) {
  const mcpTool = toMcpTool(tool);
  server.registerTool(tool.name, mcpTool.inputSchema, async input => tool.handler(input));
}

// Start server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
