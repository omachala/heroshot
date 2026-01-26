/**
 * Tests for MCP tool definitions and formatResult.
 * Ensures proper tool registration and result formatting.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tools } from '../tools/definitions';

// Mock the sync module for tool handler tests
vi.mock('../../sync/sync', () => ({
  sync: vi.fn(),
}));

import { sync } from '../../sync/sync';

const TEST_DIR = path.join(import.meta.dirname, '.test-definitions-workspace');
const CONFIG_DIR = path.join(TEST_DIR, '.heroshot');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function setupTestConfig(config: object = { screenshots: [] }): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

describe('MCP Tool Definitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('tools registry', () => {
    it('should export 5 tools', () => {
      expect(tools).toHaveLength(5);
    });

    it('should have heroshot_sync tool', () => {
      const syncTool = tools.find(t => t.name === 'heroshot_sync');
      expect(syncTool).toBeDefined();
      expect(syncTool?.description).toContain('Capture');
    });

    it('should have heroshot_add tool', () => {
      const addTool = tools.find(t => t.name === 'heroshot_add');
      expect(addTool).toBeDefined();
      expect(addTool?.description).toContain('Add');
    });

    it('should have heroshot_list tool', () => {
      const listTool = tools.find(t => t.name === 'heroshot_list');
      expect(listTool).toBeDefined();
      expect(listTool?.description).toContain('List');
    });

    it('should have heroshot_snippet tool', () => {
      const snippetTool = tools.find(t => t.name === 'heroshot_snippet');
      expect(snippetTool).toBeDefined();
      expect(snippetTool?.description).toContain('snippet');
    });

    it('should have heroshot_remove tool', () => {
      const removeTool = tools.find(t => t.name === 'heroshot_remove');
      expect(removeTool).toBeDefined();
      expect(removeTool?.description).toContain('Remove');
    });

    it('should have valid inputSchema for each tool', () => {
      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.safeParse).toBeTypeOf('function');
      }
    });

    it('should have async handler for each tool', () => {
      for (const tool of tools) {
        expect(tool.handler).toBeTypeOf('function');
      }
    });
  });

  describe('tool handlers return ToolResult format', () => {
    it('heroshot_list returns proper format on success', async () => {
      setupTestConfig({
        screenshots: [{ id: 'abc', name: 'Test', url: 'https://example.com' }],
      });

      const listTool = tools.find(t => t.name === 'heroshot_list')!;
      const result = await listTool.handler({ configPath: CONFIG_PATH });

      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toContain('success');
      expect(result.isError).toBeFalsy();
    });

    it('heroshot_add returns proper format on success', async () => {
      setupTestConfig();

      const addTool = tools.find(t => t.name === 'heroshot_add')!;
      const result = await addTool.handler({
        configPath: CONFIG_PATH,
        screenshot: { name: 'New', url: 'https://example.com' },
      });

      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeFalsy();
    });

    it('heroshot_add returns error format on failure', async () => {
      setupTestConfig({
        screenshots: [{ id: 'abc', name: 'Existing', url: 'https://example.com' }],
      });

      const addTool = tools.find(t => t.name === 'heroshot_add')!;
      const result = await addTool.handler({
        configPath: CONFIG_PATH,
        screenshot: { name: 'Existing', url: 'https://example.com/new' },
      });

      expect(result.content[0]?.text).toContain('false');
      expect(result.isError).toBe(true);
    });

    it('heroshot_remove returns proper format on success', async () => {
      setupTestConfig({
        screenshots: [{ id: 'abc12345', name: 'ToRemove', url: 'https://example.com' }],
      });

      const removeTool = tools.find(t => t.name === 'heroshot_remove')!;
      const result = await removeTool.handler({
        configPath: CONFIG_PATH,
        id: 'abc12345',
      });

      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]?.type).toBe('text');
      expect(result.isError).toBeFalsy();
    });

    it('heroshot_remove returns error format on failure', async () => {
      setupTestConfig();

      const removeTool = tools.find(t => t.name === 'heroshot_remove')!;
      const result = await removeTool.handler({
        configPath: CONFIG_PATH,
        id: 'nonexistent',
      });

      expect(result.content[0]?.text).toContain('false');
      expect(result.isError).toBe(true);
    });

    it('heroshot_snippet returns proper format', async () => {
      setupTestConfig({
        screenshots: [{ id: 'abc', name: 'Test', url: 'https://example.com' }],
      });

      const snippetTool = tools.find(t => t.name === 'heroshot_snippet')!;
      const result = await snippetTool.handler({ configPath: CONFIG_PATH });

      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]?.type).toBe('text');
    });

    it('heroshot_sync returns proper format', async () => {
      setupTestConfig();

      vi.mocked(sync).mockResolvedValue({
        total: 0,
        success: 0,
        failed: 0,
        results: [],
        staleFiles: [],
        deletedFiles: [],
      });

      const syncTool = tools.find(t => t.name === 'heroshot_sync')!;
      const result = await syncTool.handler({ configPath: CONFIG_PATH });

      expect(result.content).toBeInstanceOf(Array);
      expect(result.content[0]?.type).toBe('text');
    });
  });

  describe('result format validation', () => {
    it('should return JSON-formatted text content', async () => {
      setupTestConfig({
        screenshots: [{ id: 'abc', name: 'Test', url: 'https://example.com' }],
      });

      const listTool = tools.find(t => t.name === 'heroshot_list')!;
      const result = await listTool.handler({ configPath: CONFIG_PATH });

      // Should be valid JSON
      const parsed = JSON.parse(result.content[0]!.text);
      expect(parsed).toHaveProperty('success');
    });

    it('should include success field in all results', async () => {
      setupTestConfig();

      for (const tool of tools) {
        // Skip sync for this test as it needs mocking
        if (tool.name === 'heroshot_sync') continue;

        // Provide required fields based on tool
        const input: Record<string, unknown> = { configPath: CONFIG_PATH };
        if (tool.name === 'heroshot_add') {
          input['screenshot'] = { name: 'Test', url: 'https://example.com' };
        }
        if (tool.name === 'heroshot_remove') {
          input['id'] = 'test-id';
        }

        const result = await tool.handler(input);
        const parsed = JSON.parse(result.content[0]!.text);
        expect(parsed).toHaveProperty('success');
      }
    });
  });
});
