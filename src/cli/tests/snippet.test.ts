import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Config } from '../../types';
import { generateSnippets, snippetAction } from '../snippet';

describe('generateSnippets', () => {
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
      },
      {
        id: 'ghi789',
        name: 'Settings Panel',
        url: 'https://example.com/settings',
        selector: '.settings',
      },
    ],
  };

  describe('pattern matching', () => {
    it('returns all screenshots when no pattern', () => {
      const results = generateSnippets(baseConfig);
      expect(results).toHaveLength(3);
    });

    it('filters by name (case-insensitive)', () => {
      const results = generateSnippets(baseConfig, 'dashboard');
      expect(results).toHaveLength(1);
      expect(results[0]?.screenshot.name).toBe('Dashboard');
    });

    it('filters by partial name match', () => {
      const results = generateSnippets(baseConfig, 'section');
      expect(results).toHaveLength(1);
      expect(results[0]?.screenshot.name).toBe('Hero Section');
    });

    it('filters by id', () => {
      const results = generateSnippets(baseConfig, 'ghi789');
      expect(results).toHaveLength(1);
      expect(results[0]?.screenshot.name).toBe('Settings Panel');
    });

    it('returns multiple matches', () => {
      const results = generateSnippets(baseConfig, 'e'); // Hero Section, Settings Panel (both have 'e')
      expect(results).toHaveLength(2);
    });

    it('returns empty array when no matches', () => {
      const results = generateSnippets(baseConfig, 'nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('snippet generation - light/dark variants', () => {
    it('generates <picture> element when colorScheme not set (both)', () => {
      const results = generateSnippets(baseConfig, 'dashboard');
      const snippet = results[0]?.snippet ?? '';

      expect(snippet).toContain('<picture>');
      expect(snippet).toContain('prefers-color-scheme: dark');
      expect(snippet).toContain('dashboard-light.png');
      expect(snippet).toContain('dashboard-dark.png');
      expect(snippet).toContain('alt="Dashboard"');
    });

    it('uses custom path prefix', () => {
      const results = generateSnippets(baseConfig, 'dashboard', {
        pathPrefix: './images/screenshots/',
      });
      const snippet = results[0]?.snippet ?? '';

      expect(snippet).toContain('./images/screenshots/dashboard-light.png');
      expect(snippet).toContain('./images/screenshots/dashboard-dark.png');
    });
  });

  describe('snippet generation - single color scheme', () => {
    it('generates simple markdown image when light only', () => {
      const config: Config = {
        ...baseConfig,
        browser: { colorScheme: 'light' },
      };
      const results = generateSnippets(config, 'dashboard');
      const snippet = results[0]?.snippet ?? '';

      expect(snippet).toBe('![Dashboard](./heroshots/dashboard-light.png)');
    });

    it('generates simple markdown image when dark only', () => {
      const config: Config = {
        ...baseConfig,
        browser: { colorScheme: 'dark' },
      };
      const results = generateSnippets(config, 'dashboard');
      const snippet = results[0]?.snippet ?? '';

      expect(snippet).toBe('![Dashboard](./heroshots/dashboard-dark.png)');
    });
  });

  describe('snippet generation - with viewports', () => {
    it('uses first viewport in filename', () => {
      const config: Config = {
        ...baseConfig,
        screenshots: [
          {
            id: 'abc123',
            name: 'Dashboard',
            url: 'https://example.com/dashboard',
            selector: '.dashboard',
            viewports: ['mobile', 'desktop'],
          },
        ],
      };
      const results = generateSnippets(config, 'dashboard');
      const snippet = results[0]?.snippet ?? '';

      expect(snippet).toContain('dashboard-mobile-light.png');
      expect(snippet).toContain('dashboard-mobile-dark.png');
    });
  });

  describe('snippet generation - JPEG format', () => {
    it('uses .jpg extension for JPEG format', () => {
      const config: Config = {
        ...baseConfig,
        outputFormat: 'jpeg',
        browser: { colorScheme: 'light' },
      };
      const results = generateSnippets(config, 'dashboard');
      const snippet = results[0]?.snippet ?? '';

      expect(snippet).toBe('![Dashboard](./heroshots/dashboard-light.jpg)');
    });
  });
});

describe('snippetAction', () => {
  const testDir = path.join(import.meta.dirname, '.test-snippet-action');
  const configDir = path.join(testDir, '.heroshot');
  const configPath = path.join(configDir, 'config.json');

  beforeAll(() => {
    // Create test directory and config
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('returns false when config file does not exist', () => {
    const result = snippetAction(undefined, {}, '/nonexistent/config.json');
    expect(result).toBe(false);
  });

  it('returns false when config has no screenshots', () => {
    const emptyConfig: Config = {
      outputDirectory: 'heroshots',
      jpegQuality: 80,
      screenshots: [],
    };
    writeFileSync(configPath, JSON.stringify(emptyConfig, null, 2));

    const result = snippetAction(undefined, {}, configPath);
    expect(result).toBe(false);
  });

  it('returns false when no screenshots match pattern', () => {
    const config: Config = {
      outputDirectory: 'heroshots',
      jpegQuality: 80,
      screenshots: [{ id: 'abc', name: 'Dashboard', url: 'https://example.com' }],
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = snippetAction('nonexistent', {}, configPath);
    expect(result).toBe(false);
  });

  it('returns true and outputs snippets when screenshots match', () => {
    const config: Config = {
      outputDirectory: 'heroshots',
      jpegQuality: 80,
      screenshots: [
        { id: 'abc', name: 'Dashboard', url: 'https://example.com' },
        { id: 'def', name: 'Settings', url: 'https://example.com/settings' },
      ],
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = snippetAction('dashboard', {}, configPath);
    expect(result).toBe(true);
  });

  it('returns true when outputting all screenshots without pattern', () => {
    const config: Config = {
      outputDirectory: 'heroshots',
      jpegQuality: 80,
      screenshots: [{ id: 'abc', name: 'Dashboard', url: 'https://example.com' }],
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = snippetAction(undefined, {}, configPath);
    expect(result).toBe(true);
  });

  it('uses custom path prefix option', () => {
    const config: Config = {
      outputDirectory: 'heroshots',
      jpegQuality: 80,
      screenshots: [{ id: 'abc', name: 'Dashboard', url: 'https://example.com' }],
    };
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    const result = snippetAction(undefined, { pathPrefix: './custom/' }, configPath);
    expect(result).toBe(true);
  });
});
