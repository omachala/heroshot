/**
 * Tests for zodToMcp utility.
 * Ensures proper conversion of Zod schemas to MCP tool format.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { ToolDefinition } from '../tools/definitions';
import { toMcpTool } from '../utils/zodToMcp';

// Helper to access JSON schema properties with type safety
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSchemaProps(schema: any): Record<string, any> {
  return schema.properties ?? {};
}

describe('zodToMcp', () => {
  describe('toMcpTool', () => {
    it('should convert simple schema to MCP format', () => {
      const schema = z.object({
        name: z.string(),
        count: z.number(),
      });

      const definition: ToolDefinition = {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: schema,
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      };

      const mcpTool = toMcpTool(definition);

      expect(mcpTool.name).toBe('test_tool');
      expect(mcpTool.description).toBe('A test tool');
      expect(mcpTool.inputSchema).toBeDefined();
      expect(mcpTool.inputSchema.type).toBe('object');

      const props = getSchemaProps(mcpTool.inputSchema);
      expect(props['name']).toBeDefined();
      expect(props['count']).toBeDefined();
    });

    it('should include required fields in JSON schema', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const definition: ToolDefinition = {
        name: 'test_tool',
        description: 'Test',
        inputSchema: schema,
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      };

      const mcpTool = toMcpTool(definition);

      expect(mcpTool.inputSchema.required).toContain('required');
      expect(mcpTool.inputSchema.required).not.toContain('optional');
    });

    it('should convert nested objects', () => {
      const schema = z.object({
        config: z.object({
          enabled: z.boolean(),
          value: z.number(),
        }),
      });

      const definition: ToolDefinition = {
        name: 'nested_tool',
        description: 'Nested test',
        inputSchema: schema,
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      };

      const mcpTool = toMcpTool(definition);
      const props = getSchemaProps(mcpTool.inputSchema);

      expect(props['config']).toBeDefined();
      expect(props['config'].type).toBe('object');
    });

    it('should convert arrays', () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      const definition: ToolDefinition = {
        name: 'array_tool',
        description: 'Array test',
        inputSchema: schema,
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      };

      const mcpTool = toMcpTool(definition);
      const props = getSchemaProps(mcpTool.inputSchema);

      expect(props['items'].type).toBe('array');
    });

    it('should include descriptions from schema', () => {
      const schema = z.object({
        name: z.string().describe('The name of the item'),
      });

      const definition: ToolDefinition = {
        name: 'described_tool',
        description: 'Tool with descriptions',
        inputSchema: schema,
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      };

      const mcpTool = toMcpTool(definition);
      const props = getSchemaProps(mcpTool.inputSchema);

      expect(props['name'].description).toBe('The name of the item');
    });

    it('should handle enums', () => {
      const schema = z.object({
        colorScheme: z.enum(['light', 'dark', 'both']),
      });

      const definition: ToolDefinition = {
        name: 'enum_tool',
        description: 'Enum test',
        inputSchema: schema,
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      };

      const mcpTool = toMcpTool(definition);
      const props = getSchemaProps(mcpTool.inputSchema);

      expect(props['colorScheme'].enum).toEqual(['light', 'dark', 'both']);
    });

    it('should handle number constraints', () => {
      const schema = z.object({
        workers: z.number().int().min(1).max(16),
      });

      const definition: ToolDefinition = {
        name: 'constrained_tool',
        description: 'Constrained test',
        inputSchema: schema,
        handler: async () => ({ content: [{ type: 'text', text: 'ok' }] }),
      };

      const mcpTool = toMcpTool(definition);
      const props = getSchemaProps(mcpTool.inputSchema);

      expect(props['workers'].type).toBe('integer');
      expect(props['workers'].minimum).toBe(1);
      expect(props['workers'].maximum).toBe(16);
    });
  });
});
