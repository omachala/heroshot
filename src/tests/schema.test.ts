/**
 * Unit tests for schema.ts
 */
import { describe, expect, it } from 'vitest';
import {
  viewportSchema,
  colorSchemeSchema,
  outputFormatSchema,
  paddingSchema,
  scrollPositionSchema,
  screenshotSchema,
  browserSchema,
  configSchema,
} from '../schema';

describe('viewportSchema', () => {
  it('accepts valid viewport', () => {
    const result = viewportSchema.parse({ width: 1920, height: 1080 });
    expect(result).toEqual({ width: 1920, height: 1080 });
  });

  it('uses default values when not provided', () => {
    const result = viewportSchema.parse({});
    expect(result).toEqual({ width: 1280, height: 800 });
  });

  it('rejects negative width', () => {
    expect(() => viewportSchema.parse({ width: -100, height: 800 })).toThrow();
  });

  it('rejects negative height', () => {
    expect(() => viewportSchema.parse({ width: 1280, height: -100 })).toThrow();
  });

  it('rejects non-integer width', () => {
    expect(() => viewportSchema.parse({ width: 1280.5, height: 800 })).toThrow();
  });

  it('rejects zero width', () => {
    expect(() => viewportSchema.parse({ width: 0, height: 800 })).toThrow();
  });
});

describe('colorSchemeSchema', () => {
  it('accepts light', () => {
    expect(colorSchemeSchema.parse('light')).toBe('light');
  });

  it('accepts dark', () => {
    expect(colorSchemeSchema.parse('dark')).toBe('dark');
  });

  it('accepts both', () => {
    expect(colorSchemeSchema.parse('both')).toBe('both');
  });

  it('rejects invalid value', () => {
    expect(() => colorSchemeSchema.parse('auto')).toThrow();
  });
});

describe('outputFormatSchema', () => {
  it('accepts png', () => {
    expect(outputFormatSchema.parse('png')).toBe('png');
  });

  it('accepts jpeg', () => {
    expect(outputFormatSchema.parse('jpeg')).toBe('jpeg');
  });

  it('defaults to png when undefined', () => {
    expect(outputFormatSchema.parse(undefined)).toBe('png');
  });

  it('rejects invalid format', () => {
    expect(() => outputFormatSchema.parse('gif')).toThrow();
  });
});

describe('paddingSchema', () => {
  it('accepts valid padding', () => {
    const result = paddingSchema.parse({ top: 10, right: 20, bottom: 30, left: 40 });
    expect(result).toEqual({ top: 10, right: 20, bottom: 30, left: 40 });
  });

  it('uses default values when not provided', () => {
    const result = paddingSchema.parse({});
    expect(result).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
  });

  it('rejects negative padding', () => {
    expect(() => paddingSchema.parse({ top: -10 })).toThrow();
  });

  it('rejects non-integer padding', () => {
    expect(() => paddingSchema.parse({ top: 10.5 })).toThrow();
  });
});

describe('scrollPositionSchema', () => {
  it('accepts valid scroll position', () => {
    const result = scrollPositionSchema.parse({ x: 100, y: 200 });
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('uses default values when not provided', () => {
    const result = scrollPositionSchema.parse({});
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('rejects negative x', () => {
    expect(() => scrollPositionSchema.parse({ x: -10, y: 0 })).toThrow();
  });

  it('rejects negative y', () => {
    expect(() => scrollPositionSchema.parse({ x: 0, y: -10 })).toThrow();
  });
});

describe('screenshotSchema', () => {
  it('accepts valid screenshot with required fields', () => {
    const result = screenshotSchema.parse({
      name: 'Hero Section',
      url: 'https://example.com',
      filename: 'hero.png',
    });
    expect(result.name).toBe('Hero Section');
    expect(result.url).toBe('https://example.com');
    expect(result.filename).toBe('hero.png');
    expect(result.id).toBeDefined();
    expect(result.id.length).toBe(8);
  });

  it('accepts screenshot with all optional fields', () => {
    const result = screenshotSchema.parse({
      id: 'custom-id',
      name: 'Hero',
      url: 'https://example.com',
      filename: 'hero.png',
      selector: '#hero',
      padding: { top: 10, right: 10, bottom: 10, left: 10 },
      scroll: { x: 0, y: 100 },
    });
    expect(result.id).toBe('custom-id');
    expect(result.selector).toBe('#hero');
    expect(result.padding).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
    expect(result.scroll).toEqual({ x: 0, y: 100 });
  });

  it('generates unique id when not provided', () => {
    const result1 = screenshotSchema.parse({
      name: 'Test',
      url: 'https://example.com',
      filename: 'test.png',
    });
    const result2 = screenshotSchema.parse({
      name: 'Test',
      url: 'https://example.com',
      filename: 'test.png',
    });
    expect(result1.id).not.toBe(result2.id);
  });

  it('rejects empty name', () => {
    expect(() =>
      screenshotSchema.parse({
        name: '',
        url: 'https://example.com',
        filename: 'test.png',
      })
    ).toThrow();
  });

  it('rejects invalid url', () => {
    expect(() =>
      screenshotSchema.parse({
        name: 'Test',
        url: 'not-a-url',
        filename: 'test.png',
      })
    ).toThrow();
  });

  it('rejects empty filename', () => {
    expect(() =>
      screenshotSchema.parse({
        name: 'Test',
        url: 'https://example.com',
        filename: '',
      })
    ).toThrow();
  });
});

describe('browserSchema', () => {
  it('accepts empty object', () => {
    const result = browserSchema.parse({});
    expect(result).toEqual({});
  });

  it('accepts viewport', () => {
    const result = browserSchema.parse({ viewport: { width: 1920, height: 1080 } });
    expect(result.viewport).toEqual({ width: 1920, height: 1080 });
  });

  it('accepts colorScheme', () => {
    const result = browserSchema.parse({ colorScheme: 'dark' });
    expect(result.colorScheme).toBe('dark');
  });

  it('accepts both viewport and colorScheme', () => {
    const result = browserSchema.parse({
      viewport: { width: 1920, height: 1080 },
      colorScheme: 'light',
    });
    expect(result.viewport).toEqual({ width: 1920, height: 1080 });
    expect(result.colorScheme).toBe('light');
  });
});

describe('configSchema', () => {
  it('accepts minimal config', () => {
    const result = configSchema.parse({});
    expect(result.outputDirectory).toBe('.');
    expect(result.jpegQuality).toBe(80);
    expect(result.screenshots).toEqual([]);
  });

  it('accepts full config', () => {
    const result = configSchema.parse({
      outputDirectory: './screenshots',
      outputFormat: 'jpeg',
      jpegQuality: 90,
      browser: {
        viewport: { width: 1920, height: 1080 },
        colorScheme: 'dark',
      },
      screenshots: [
        {
          name: 'Hero',
          url: 'https://example.com',
          filename: 'hero.png',
        },
      ],
    });
    expect(result.outputDirectory).toBe('./screenshots');
    expect(result.outputFormat).toBe('jpeg');
    expect(result.jpegQuality).toBe(90);
    expect(result.browser?.viewport).toEqual({ width: 1920, height: 1080 });
    expect(result.browser?.colorScheme).toBe('dark');
    expect(result.screenshots.length).toBe(1);
  });

  it('rejects jpegQuality below 1', () => {
    expect(() => configSchema.parse({ jpegQuality: 0 })).toThrow();
  });

  it('rejects jpegQuality above 100', () => {
    expect(() => configSchema.parse({ jpegQuality: 101 })).toThrow();
  });

  it('validates nested screenshot schemas', () => {
    expect(() =>
      configSchema.parse({
        screenshots: [{ name: '', url: 'https://example.com', filename: 'test.png' }],
      })
    ).toThrow();
  });
});
