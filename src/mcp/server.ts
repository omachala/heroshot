/**
 * Heroshot MCP Server
 *
 * MCP server for screenshot automation. Tools are registered using the
 * MCP SDK's native Zod-raw-shape form so tool inputSchemas survive the
 * `tools/list` advertisement and arguments get parsed before reaching handlers.
 */

// eslint-disable-next-line no-restricted-imports -- MCP SDK requires .js extension for ESM
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// eslint-disable-next-line no-restricted-imports -- MCP SDK requires .js extension for ESM
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { tools } from './tools/definitions';

export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: 'heroshot',
    version: '0.1.0',
  });

  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema.shape,
      },
      async input => tool.handler(input)
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
