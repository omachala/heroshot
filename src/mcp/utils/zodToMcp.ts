/**
 * Utilities for converting Zod schemas to MCP tool definitions.
 */

import { z } from 'zod';
import type { ToolDefinition } from '../tools/definitions';

/**
 * Convert a ToolDefinition to MCP tool format.
 * Uses z.toJSONSchema() for automatic schema conversion.
 */
export function toMcpTool(definition: ToolDefinition) {
  return {
    name: definition.name,
    description: definition.description,
    inputSchema: z.toJSONSchema(definition.inputSchema),
  };
}
