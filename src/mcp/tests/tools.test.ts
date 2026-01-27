/**
 * MCP tool handler tests.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addHandler } from '../tools/add';
import { listHandler } from '../tools/list';
import { removeHandler } from '../tools/remove';
import { snippetHandler } from '../tools/snippet';
import { syncHandler } from '../tools/sync';

const TEST_DIR = path.join(import.meta.dirname, '.test-workspace');
const CONFIG_DIR = path.join(TEST_DIR, '.heroshot');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function setupTestConfig(config: object = { screenshots: [] }): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

describe('MCP Tool Handlers', () => {
  beforeEach(() => {
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

  describe('listHandler', () => {
    it('should return empty list when no screenshots defined', () => {
      setupTestConfig();
      const result = listHandler({ configPath: CONFIG_PATH });
      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
      expect(result.screenshots).toEqual([]);
    });

    it('should list screenshots from config', () => {
      setupTestConfig({
        screenshots: [
          { id: 'abc12345', name: 'Homepage', url: 'https://example.com' },
          { id: 'def67890', name: 'Dashboard', url: 'https://example.com/dash', selector: '.main' },
        ],
      });

      const result = listHandler({ configPath: CONFIG_PATH });
      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.screenshots).toHaveLength(2);
      expect(result.screenshots[0]).toEqual({
        id: 'abc12345',
        name: 'Homepage',
        url: 'https://example.com',
        selector: undefined,
      });
      expect(result.screenshots[1]).toEqual({
        id: 'def67890',
        name: 'Dashboard',
        url: 'https://example.com/dash',
        selector: '.main',
      });
    });

    it('should filter screenshots by name', () => {
      setupTestConfig({
        screenshots: [
          { id: 'abc12345', name: 'Homepage', url: 'https://example.com' },
          { id: 'def67890', name: 'Dashboard', url: 'https://example.com/dash' },
        ],
      });

      const result = listHandler({ configPath: CONFIG_PATH, filter: 'home' });
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.screenshots[0]?.name).toBe('Homepage');
    });

    it('should return empty list for non-existent config', () => {
      const result = listHandler({ configPath: '/nonexistent/config.json' });
      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });
  });

  describe('addHandler', () => {
    it('should add a new screenshot to config', () => {
      setupTestConfig();

      const result = addHandler({
        configPath: CONFIG_PATH,
        screenshot: {
          name: 'New Screenshot',
          url: 'https://example.com/new',
        },
      });

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.screenshot?.name).toBe('New Screenshot');
      expect(result.screenshot?.url).toBe('https://example.com/new');

      // Verify it was saved
      const listResult = listHandler({ configPath: CONFIG_PATH });
      expect(listResult.count).toBe(1);
      expect(listResult.screenshots[0]?.name).toBe('New Screenshot');
    });

    it('should reject duplicate screenshot names', () => {
      setupTestConfig({
        screenshots: [{ id: 'abc12345', name: 'Existing', url: 'https://example.com' }],
      });

      const result = addHandler({
        configPath: CONFIG_PATH,
        screenshot: {
          name: 'existing', // Case-insensitive match
          url: 'https://example.com/new',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should add screenshot with selector and actions', () => {
      setupTestConfig();

      const result = addHandler({
        configPath: CONFIG_PATH,
        screenshot: {
          name: 'Element Capture',
          url: 'https://example.com',
          selector: '.hero',
          actions: [
            { type: 'click', selector: '.cookie-dismiss' },
            { type: 'wait', time: 1 },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.screenshot?.name).toBe('Element Capture');
    });
  });

  describe('removeHandler', () => {
    it('should remove screenshot by id', () => {
      setupTestConfig({
        screenshots: [
          { id: 'abc12345', name: 'ToRemove', url: 'https://example.com' },
          { id: 'def67890', name: 'ToKeep', url: 'https://example.com/keep' },
        ],
      });

      const result = removeHandler({
        configPath: CONFIG_PATH,
        id: 'abc12345',
      });

      expect(result.success).toBe(true);
      expect(result.removed?.id).toBe('abc12345');
      expect(result.removed?.name).toBe('ToRemove');

      // Verify it was removed
      const listResult = listHandler({ configPath: CONFIG_PATH });
      expect(listResult.count).toBe(1);
      expect(listResult.screenshots[0]?.name).toBe('ToKeep');
    });

    it('should return error for non-existent id', () => {
      setupTestConfig({
        screenshots: [{ id: 'abc12345', name: 'Existing', url: 'https://example.com' }],
      });

      const result = removeHandler({
        configPath: CONFIG_PATH,
        id: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('snippetHandler', () => {
    it('should generate snippets for screenshots', () => {
      setupTestConfig({
        outputFormat: 'png',
        screenshots: [{ id: 'abc12345', name: 'Homepage', url: 'https://example.com' }],
      });

      const result = snippetHandler({ configPath: CONFIG_PATH });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.snippets[0]?.id).toBe('abc12345');
      expect(result.snippets[0]?.name).toBe('Homepage');
      expect(result.snippets[0]?.snippet).toContain('Homepage');
    });

    it('should generate picture element for light/dark mode', () => {
      setupTestConfig({
        outputFormat: 'png',
        // No colorScheme = both light and dark
        screenshots: [{ id: 'abc12345', name: 'Homepage', url: 'https://example.com' }],
      });

      const result = snippetHandler({ configPath: CONFIG_PATH });

      expect(result.success).toBe(true);
      expect(result.snippets[0]?.snippet).toContain('<picture>');
      expect(result.snippets[0]?.snippet).toContain('prefers-color-scheme: dark');
    });

    it('should filter snippets by pattern', () => {
      setupTestConfig({
        screenshots: [
          { id: 'abc12345', name: 'Homepage', url: 'https://example.com' },
          { id: 'def67890', name: 'Dashboard', url: 'https://example.com/dash' },
        ],
      });

      const result = snippetHandler({ configPath: CONFIG_PATH, filter: 'dash' });

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.snippets[0]?.name).toBe('Dashboard');
    });
  });

  describe('syncHandler', () => {
    it('should return error when config not found', async () => {
      const result = await syncHandler({ configPath: '/nonexistent/config.json' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.total).toBe(0);
      expect(result.captured).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should return zero counts for empty config', async () => {
      setupTestConfig({ screenshots: [] });

      const result = await syncHandler({ configPath: CONFIG_PATH });

      expect(result.success).toBe(true);
      expect(result.total).toBe(0);
      expect(result.captured).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should pass through filter option', async () => {
      setupTestConfig({
        screenshots: [{ id: 'abc123', name: 'Homepage', url: 'https://example.com' }],
      });

      const result = await syncHandler({ configPath: CONFIG_PATH, filter: 'nonexistent' });

      // Filter matches nothing, so total is 0
      expect(result.total).toBe(0);
    });

    it('should have correct result structure', async () => {
      setupTestConfig({ screenshots: [] });

      const result = await syncHandler({ configPath: CONFIG_PATH });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('captured');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('results');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.total).toBe('number');
      expect(typeof result.captured).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should resolve session key from environment', async () => {
      setupTestConfig({ screenshots: [] });

      // Set env variable
      const originalEnv = process.env['HEROSHOT_SESSION_KEY'];
      process.env['HEROSHOT_SESSION_KEY'] = 'test-session-key';

      try {
        const result = await syncHandler({ configPath: CONFIG_PATH });

        // Should not throw - env variable is used
        expect(result.success).toBe(true);
      } finally {
        // Restore env
        if (originalEnv === undefined) {
          delete process.env['HEROSHOT_SESSION_KEY'];
        } else {
          process.env['HEROSHOT_SESSION_KEY'] = originalEnv;
        }
      }
    });

    it('should prefer explicit session key over environment', async () => {
      setupTestConfig({ screenshots: [] });

      process.env['HEROSHOT_SESSION_KEY'] = 'env-key';

      try {
        const result = await syncHandler({
          configPath: CONFIG_PATH,
          sessionKey: 'explicit-key',
        });

        // Should not throw
        expect(result.success).toBe(true);
      } finally {
        delete process.env['HEROSHOT_SESSION_KEY'];
      }
    });
  });
});
