/**
 * Unit tests for config.ts
 */
import { describe, expect, it } from 'vitest';
import { parseConfig } from '../config';

describe('parseConfig', () => {
  it('parses minimal config', () => {
    const result = parseConfig({});
    expect(result.outputDirectory).toBe('heroshots');
    expect(result.jpegQuality).toBe(80);
    expect(result.screenshots).toEqual([]);
  });

  it('parses full config', () => {
    const input = {
      outputDirectory: './screenshots',
      outputFormat: 'jpeg',
      jpegQuality: 95,
      browser: {
        viewport: { width: 1920, height: 1080 },
        colorScheme: 'dark',
      },
      screenshots: [
        {
          name: 'Homepage Hero',
          url: 'https://example.com',
          selector: '#hero',
        },
      ],
    };
    const result = parseConfig(input);
    expect(result.outputDirectory).toBe('./screenshots');
    expect(result.outputFormat).toBe('jpeg');
    expect(result.jpegQuality).toBe(95);
    expect(result.browser?.colorScheme).toBe('dark');
    expect(result.screenshots[0]?.name).toBe('Homepage Hero');
  });

  it('applies default values', () => {
    const result = parseConfig({
      screenshots: [
        {
          name: 'Test',
          url: 'https://example.com',
        },
      ],
    });
    expect(result.outputDirectory).toBe('heroshots');
    expect(result.jpegQuality).toBe(80);
    expect(result.screenshots[0]?.id).toBeDefined();
  });

  it('throws on invalid url', () => {
    expect(() =>
      parseConfig({
        screenshots: [
          {
            name: 'Test',
            url: 'invalid-url',
          },
        ],
      })
    ).toThrow();
  });

  it('throws on invalid jpegQuality', () => {
    expect(() => parseConfig({ jpegQuality: 150 })).toThrow();
  });

  it('throws on invalid colorScheme', () => {
    expect(() =>
      parseConfig({
        browser: { colorScheme: 'invalid' },
      })
    ).toThrow();
  });

  it('throws on missing required screenshot fields', () => {
    expect(() =>
      parseConfig({
        screenshots: [{ name: 'Test' }],
      })
    ).toThrow();
  });

  it('throws on non-object input', () => {
    expect(() => parseConfig('not an object')).toThrow();
    expect(() => parseConfig(null)).toThrow();
    expect(() => parseConfig(123)).toThrow();
  });
});
