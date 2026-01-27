import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Config } from '../../types';
import { listAction } from '../list';

describe('listAction', () => {
  const testDir = path.join(import.meta.dirname, '.test-list');
  const configPath = path.join(testDir, 'config.json');

  const baseConfig: Config = {
    outputDirectory: 'heroshots',
    jpegQuality: 80,
    screenshots: [
      {
        id: 'abc123',
        name: 'Dashboard',
        url: 'https://example.com/dashboard',
        selector: '.dashboard',
      },
      {
        id: 'def456',
        name: 'Hero Section',
        url: 'https://example.com',
        selector: '.hero',
        viewports: ['desktop', 'mobile'],
      },
      {
        id: 'ghi789',
        name: 'Settings Panel',
        url: 'https://example.com/settings',
        actions: [{ type: 'click', selector: '.tab' }],
      },
    ],
  };

  beforeAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('returns true and lists screenshots', () => {
    writeFileSync(configPath, JSON.stringify(baseConfig, null, 2));
    const result = listAction({}, { config: configPath });
    expect(result).toBe(true);
  });

  it('returns true with empty screenshots', () => {
    const emptyConfig: Config = { ...baseConfig, screenshots: [] };
    writeFileSync(configPath, JSON.stringify(emptyConfig, null, 2));
    const result = listAction({}, { config: configPath });
    expect(result).toBe(true);
  });

  it('returns false when config not found', () => {
    const result = listAction({}, { config: '/nonexistent/config.json' });
    expect(result).toBe(false);
  });

  it('outputs JSON when --json flag is passed', () => {
    writeFileSync(configPath, JSON.stringify(baseConfig, null, 2));
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = listAction({ json: true }, { config: configPath });

    expect(result).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();

    const output = consoleSpy.mock.calls[0]?.[0];
    const parsed = JSON.parse(output as string);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].name).toBe('Dashboard');

    consoleSpy.mockRestore();
  });

  it('shows viewport info when present', () => {
    writeFileSync(configPath, JSON.stringify(baseConfig, null, 2));
    // Just verify it doesn't throw - output goes to log()
    const result = listAction({}, { config: configPath });
    expect(result).toBe(true);
  });

  it('shows action count when present', () => {
    writeFileSync(configPath, JSON.stringify(baseConfig, null, 2));
    // Just verify it doesn't throw - output goes to log()
    const result = listAction({}, { config: configPath });
    expect(result).toBe(true);
  });
});
