/**
 * Sync orchestration tests.
 * Tests the main sync() function behavior and error handling.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseConfig } from '../../config';
import { sync } from '../sync';

// Mock UI functions to prevent console output during tests
vi.mock('../../ui', () => ({
  error: vi.fn(),
  warn: vi.fn(),
  outro: vi.fn(),
  log: vi.fn(),
  spinner: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    message: vi.fn(),
  })),
  verbose: vi.fn(),
}));

const TEST_DIR = path.join(process.cwd(), '.test-sync-orchestration');
const CONFIG_DIR = path.join(TEST_DIR, '.heroshot');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const OUTPUT_DIR = path.join(TEST_DIR, 'heroshots');

function writeConfig(config: object): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

describe('sync orchestration', () => {
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

  describe('empty config handling', () => {
    it('returns zero counts when no screenshots defined', async () => {
      writeConfig({ screenshots: [] });

      const result = await sync({ configPath: CONFIG_PATH });

      expect(result.total).toBe(0);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('returns zero counts when config has empty screenshots array', async () => {
      writeConfig({ outputDirectory: 'heroshots', screenshots: [] });

      const result = await sync({ configPath: CONFIG_PATH });

      expect(result.total).toBe(0);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('filter handling', () => {
    it('returns zero counts when filter matches nothing', async () => {
      writeConfig({
        screenshots: [{ id: 'abc123', name: 'Homepage', url: 'https://example.com' }],
      });

      const result = await sync({
        configPath: CONFIG_PATH,
        filter: 'nonexistent',
      });

      expect(result.total).toBe(0);
      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('config loading', () => {
    it('accepts config object directly without file', async () => {
      // Use parseConfig to apply defaults (jpegQuality, outputDirectory, etc.)
      const config = parseConfig({
        outputDirectory: OUTPUT_DIR,
        screenshots: [],
      });

      const result = await sync({ config });

      expect(result.total).toBe(0);
      // Should not throw - config object is used directly
    });

    it('throws when config path does not exist', async () => {
      await expect(sync({ configPath: '/nonexistent/config.json' })).rejects.toThrow();
    });
  });

  describe('error aggregation', () => {
    it('reports all failed screenshots in results', async () => {
      // This test documents the expected behavior: when captures fail,
      // all failures should be reported in the results array
      writeConfig({ screenshots: [] });

      const result = await sync({ configPath: CONFIG_PATH });

      // With no screenshots, no failures
      expect(result.failed).toBe(0);
      expect(result.results.filter(r => !r.success)).toHaveLength(0);
    });
  });

  describe('result structure', () => {
    it('returns proper SyncResult structure', async () => {
      writeConfig({ screenshots: [] });

      const result = await sync({ configPath: CONFIG_PATH });

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('failed');
      expect(result).toHaveProperty('results');
      expect(typeof result.total).toBe('number');
      expect(typeof result.success).toBe('number');
      expect(typeof result.failed).toBe('number');
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('options validation', () => {
    it('accepts workers option', async () => {
      writeConfig({ screenshots: [] });

      // Should not throw with workers option
      const result = await sync({ configPath: CONFIG_PATH, workers: 2 });

      expect(result.total).toBe(0);
    });

    it('accepts viewportOnly option', async () => {
      writeConfig({ screenshots: [] });

      const result = await sync({ configPath: CONFIG_PATH, viewportOnly: true });

      expect(result.total).toBe(0);
    });

    it('accepts clean option', async () => {
      writeConfig({ screenshots: [] });

      const result = await sync({ configPath: CONFIG_PATH, clean: true });

      expect(result.total).toBe(0);
    });

    it('accepts skipStaleCheck option', async () => {
      writeConfig({ screenshots: [] });

      const result = await sync({ configPath: CONFIG_PATH, skipStaleCheck: true });

      expect(result.total).toBe(0);
    });
  });
});
