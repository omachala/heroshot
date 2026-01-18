/**
 * Unit tests for configFile.ts
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ensureHeroshotDirectory,
  getConfigPath,
  getHeroshotDirectory,
  loadConfig,
  saveConfig,
} from '../configFile';

describe('getHeroshotDirectory', () => {
  it('returns .heroshot path in specified directory', () => {
    const result = getHeroshotDirectory('/some/directory');
    expect(result).toBe('/some/directory/.heroshot');
  });
});

describe('ensureHeroshotDirectory', () => {
  const testDir = '/tmp/heroshot-ensure-test-' + Date.now();

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('creates .heroshot directory when it does not exist', () => {
    const heroshotPath = ensureHeroshotDirectory(testDir);

    expect(existsSync(heroshotPath)).toBe(true);
    expect(heroshotPath).toBe(path.join(testDir, '.heroshot'));
  });

  it('creates README.md when directory is created', () => {
    ensureHeroshotDirectory(testDir);

    const readmePath = path.join(testDir, '.heroshot', 'README.md');
    expect(existsSync(readmePath)).toBe(true);

    const content = readFileSync(readmePath, 'utf8');
    expect(content).toContain('# Heroshot');
    expect(content).toContain('session.enc');
  });

  it('creates README.md when directory exists but README does not', () => {
    const heroshotPath = path.join(testDir, '.heroshot');
    mkdirSync(heroshotPath, { recursive: true });

    ensureHeroshotDirectory(testDir);

    const readmePath = path.join(heroshotPath, 'README.md');
    expect(existsSync(readmePath)).toBe(true);
  });

  it('does not overwrite existing README', () => {
    const heroshotPath = path.join(testDir, '.heroshot');
    mkdirSync(heroshotPath, { recursive: true });

    const readmePath = path.join(heroshotPath, 'README.md');
    writeFileSync(readmePath, 'Custom README content');

    ensureHeroshotDirectory(testDir);

    const content = readFileSync(readmePath, 'utf8');
    expect(content).toBe('Custom README content');
  });
});

describe('getConfigPath', () => {
  it('returns path with .heroshot/config.json in specified directory', () => {
    const result = getConfigPath('/some/directory');
    expect(result).toBe('/some/directory/.heroshot/config.json');
  });

  it('returns path with .heroshot/config.json in current directory when no arg', () => {
    const result = getConfigPath();
    expect(result).toBe(path.join(process.cwd(), '.heroshot', 'config.json'));
  });

  it('handles relative paths', () => {
    const result = getConfigPath('./subdir');
    expect(result).toBe('subdir/.heroshot/config.json');
  });
});

describe('loadConfig', () => {
  const testDir = '/tmp/heroshot-test-' + Date.now();
  const configPath = path.join(testDir, 'heroshot.json');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('returns default config when file does not exist', () => {
    const result = loadConfig(path.join(testDir, 'nonexistent.json'));
    expect(result.outputDirectory).toBe('heroshots');
    expect(result.jpegQuality).toBe(80);
    expect(result.screenshots).toEqual([]);
  });

  it('loads and parses valid config file', () => {
    const config = {
      outputDirectory: './screenshots',
      screenshots: [
        {
          name: 'Test',
          url: 'https://example.com',
        },
      ],
    };
    writeFileSync(configPath, JSON.stringify(config));

    const result = loadConfig(configPath);
    expect(result.outputDirectory).toBe('./screenshots');
    expect(result.screenshots[0]?.name).toBe('Test');
    expect(result.screenshots[0]?.id).toBeDefined();
  });

  it('applies defaults to loaded config', () => {
    const config = {
      screenshots: [
        {
          name: 'Test',
          url: 'https://example.com',
        },
      ],
    };
    writeFileSync(configPath, JSON.stringify(config));

    const result = loadConfig(configPath);
    expect(result.outputDirectory).toBe('heroshots');
    expect(result.jpegQuality).toBe(80);
  });

  it('throws on invalid JSON', () => {
    writeFileSync(configPath, 'not valid json {');
    expect(() => loadConfig(configPath)).toThrow();
  });

  it('throws on invalid config schema', () => {
    const invalidConfig = {
      screenshots: [{ name: 'Test' }], // missing url
    };
    writeFileSync(configPath, JSON.stringify(invalidConfig));
    expect(() => loadConfig(configPath)).toThrow();
  });
});

describe('saveConfig', () => {
  const testDir = '/tmp/heroshot-test-' + Date.now();
  const configPath = path.join(testDir, 'heroshot.json');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  it('saves config to file', () => {
    const config = {
      outputDirectory: './output',
      jpegQuality: 80,
      screenshots: [],
    };

    saveConfig(configPath, config as any);

    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed.outputDirectory).toBe('./output');
  });

  it('formats JSON with 2-space indentation', () => {
    const config = {
      outputDirectory: '.',
      jpegQuality: 80,
      screenshots: [],
    };

    saveConfig(configPath, config as any);

    const content = readFileSync(configPath, 'utf8');
    expect(content).toContain('  "outputDirectory"');
  });

  it('overwrites existing file', () => {
    writeFileSync(configPath, JSON.stringify({ old: 'data' }));

    const config = {
      outputDirectory: './new',
      jpegQuality: 90,
      screenshots: [],
    };

    saveConfig(configPath, config as any);

    const content = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed.outputDirectory).toBe('./new');
    expect(parsed.old).toBeUndefined();
  });

  it('creates parent directory if it does not exist', () => {
    const nestedPath = path.join(testDir, 'nested', '.heroshot', 'config.json');
    const config = {
      outputDirectory: '.',
      jpegQuality: 80,
      screenshots: [],
    };

    saveConfig(nestedPath, config as any);

    expect(existsSync(nestedPath)).toBe(true);
  });
});
