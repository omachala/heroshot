/**
 * Tests for sync tool handler.
 * Uses mocking to test without browser dependency.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { syncHandler } from '../tools/sync';

// Mock the sync module
vi.mock('../../sync/sync', () => ({
  sync: vi.fn(),
}));

import { sync } from '../../sync/sync';

const TEST_DIR = path.join(import.meta.dirname, '.test-sync-workspace');
const CONFIG_DIR = path.join(TEST_DIR, '.heroshot');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

function setupTestConfig(config: object = { screenshots: [] }): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

describe('syncHandler', () => {
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

  it('should return success result when all screenshots captured', async () => {
    setupTestConfig({
      screenshots: [{ id: 'abc12345', name: 'Homepage', url: 'https://example.com' }],
    });

    vi.mocked(sync).mockResolvedValue({
      total: 2,
      success: 2,
      failed: 0,
      results: [
        { id: 'abc12345', name: 'Homepage', filename: 'homepage-light.png', success: true },
        { id: 'abc12345', name: 'Homepage', filename: 'homepage-dark.png', success: true },
      ],
      staleFiles: [],
      deletedFiles: [],
    });

    const result = await syncHandler({ configPath: CONFIG_PATH });

    expect(result.success).toBe(true);
    expect(result.total).toBe(2);
    expect(result.captured).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(2);
  });

  it('should return failure result when some screenshots fail', async () => {
    setupTestConfig({
      screenshots: [{ id: 'abc12345', name: 'Broken', url: 'https://invalid.example' }],
    });

    vi.mocked(sync).mockResolvedValue({
      total: 1,
      success: 0,
      failed: 1,
      results: [
        {
          id: 'abc12345',
          name: 'Broken',
          filename: 'broken-light.png',
          success: false,
          error: 'Navigation failed',
        },
      ],
      staleFiles: [],
      deletedFiles: [],
    });

    const result = await syncHandler({ configPath: CONFIG_PATH });

    expect(result.success).toBe(false);
    expect(result.failed).toBe(1);
    expect(result.results[0]?.error).toBe('Navigation failed');
  });

  it('should pass filter option to sync', async () => {
    setupTestConfig();

    vi.mocked(sync).mockResolvedValue({
      total: 1,
      success: 1,
      failed: 0,
      results: [],
      staleFiles: [],
      deletedFiles: [],
    });

    await syncHandler({ configPath: CONFIG_PATH, filter: 'homepage' });

    expect(sync).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: 'homepage',
      })
    );
  });

  it('should pass clean option to sync', async () => {
    setupTestConfig();

    vi.mocked(sync).mockResolvedValue({
      total: 0,
      success: 0,
      failed: 0,
      results: [],
      staleFiles: ['old-file.png'],
      deletedFiles: ['old-file.png'],
    });

    const result = await syncHandler({ configPath: CONFIG_PATH, clean: true });

    expect(sync).toHaveBeenCalledWith(
      expect.objectContaining({
        clean: true,
      })
    );
    expect(result.deletedFiles).toContain('old-file.png');
  });

  it('should pass workers option to sync', async () => {
    setupTestConfig();

    vi.mocked(sync).mockResolvedValue({
      total: 0,
      success: 0,
      failed: 0,
      results: [],
      staleFiles: [],
      deletedFiles: [],
    });

    await syncHandler({ configPath: CONFIG_PATH, workers: 4 });

    expect(sync).toHaveBeenCalledWith(
      expect.objectContaining({
        workers: 4,
      })
    );
  });

  it('should pass sessionKey option to sync', async () => {
    setupTestConfig();

    vi.mocked(sync).mockResolvedValue({
      total: 0,
      success: 0,
      failed: 0,
      results: [],
      staleFiles: [],
      deletedFiles: [],
    });

    await syncHandler({ configPath: CONFIG_PATH, sessionKey: 'encrypted-session' });

    expect(sync).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionKey: 'encrypted-session',
      })
    );
  });

  it('should use HEROSHOT_SESSION_KEY env var when sessionKey not provided', async () => {
    setupTestConfig();
    const originalEnv = process.env['HEROSHOT_SESSION_KEY'];
    process.env['HEROSHOT_SESSION_KEY'] = 'env-session-key';

    vi.mocked(sync).mockResolvedValue({
      total: 0,
      success: 0,
      failed: 0,
      results: [],
      staleFiles: [],
      deletedFiles: [],
    });

    await syncHandler({ configPath: CONFIG_PATH });

    expect(sync).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionKey: 'env-session-key',
      })
    );

    // Restore env
    if (originalEnv === undefined) {
      delete process.env['HEROSHOT_SESSION_KEY'];
    } else {
      process.env['HEROSHOT_SESSION_KEY'] = originalEnv;
    }
  });

  it('should handle sync throwing an error', async () => {
    setupTestConfig();

    vi.mocked(sync).mockRejectedValue(new Error('Browser crashed'));

    const result = await syncHandler({ configPath: CONFIG_PATH });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Browser crashed');
    expect(result.total).toBe(0);
    expect(result.captured).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('should handle non-Error exceptions', async () => {
    setupTestConfig();

    vi.mocked(sync).mockRejectedValue('String error');

    const result = await syncHandler({ configPath: CONFIG_PATH });

    expect(result.success).toBe(false);
    expect(result.error).toBe('String error');
  });

  it('should include stale files in result', async () => {
    setupTestConfig();

    vi.mocked(sync).mockResolvedValue({
      total: 1,
      success: 1,
      failed: 0,
      results: [],
      staleFiles: ['old-screenshot.png', 'unused-file.png'],
      deletedFiles: [],
    });

    const result = await syncHandler({ configPath: CONFIG_PATH });

    expect(result.staleFiles).toEqual(['old-screenshot.png', 'unused-file.png']);
  });
});
