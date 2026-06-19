import { describe, expect, it } from 'vitest';
import type { Config } from '../../types';
import { buildShotConfig } from '../buildShotConfig';

/** Helper to create a minimal Config for testing */
function createConfig(overrides: Partial<Config> = {}): Config {
  return {
    outputDirectory: '.',
    jpegQuality: 80,
    screenshots: [],
    ...overrides,
  };
}

describe('buildShotConfig', () => {
  it('creates config with default values', () => {
    const result = buildShotConfig('https://example.com', undefined, undefined);
    expect(result.outputDirectory).toBe('.');
    expect(result.outputFormat).toBe('png');
    expect(result.jpegQuality).toBe(80);
    expect(result.screenshots).toHaveLength(1);
    expect(result.screenshots[0]?.url).toBe('https://example.com');
  });

  it('uses jpeg format when quality is specified', () => {
    const result = buildShotConfig('https://example.com', { quality: 90 }, undefined);
    expect(result.outputFormat).toBe('jpeg');
    expect(result.jpegQuality).toBe(90);
  });

  it('preserves outputFormat from existing config when no quality specified', () => {
    const result = buildShotConfig(
      'https://example.com',
      undefined,
      createConfig({ outputFormat: 'jpeg', jpegQuality: 75 })
    );
    expect(result.outputFormat).toBe('jpeg');
  });

  it('preserves jpegQuality from existing config', () => {
    const result = buildShotConfig(
      'https://example.com',
      undefined,
      createConfig({ jpegQuality: 95 })
    );
    expect(result.jpegQuality).toBe(95);
  });

  it('uses light color scheme for oneshot mode', () => {
    const result = buildShotConfig('https://example.com', undefined, undefined);
    expect(result.browser?.colorScheme).toBe('light');
  });

  it('uses dark color scheme when dark flag is set', () => {
    const result = buildShotConfig('https://example.com', { dark: true }, undefined);
    expect(result.browser?.colorScheme).toBe('dark');
  });

  it('uses viewport from options', () => {
    const result = buildShotConfig('https://example.com', { mobile: true }, undefined);
    expect(result.browser?.viewport).toEqual({ width: 430, height: 932 });
  });

  it('uses viewport from existing config', () => {
    const result = buildShotConfig(
      'https://example.com',
      undefined,
      createConfig({ browser: { viewport: { width: 1920, height: 1080 } } })
    );
    expect(result.browser?.viewport).toEqual({ width: 1920, height: 1080 });
  });

  it('uses device scale factor from options', () => {
    const result = buildShotConfig('https://example.com', { retina: true }, undefined);
    expect(result.browser?.deviceScaleFactor).toBe(2);
  });

  it('uses device scale factor from existing config', () => {
    const result = buildShotConfig(
      'https://example.com',
      undefined,
      createConfig({ browser: { deviceScaleFactor: 1.5 } })
    );
    expect(result.browser?.deviceScaleFactor).toBe(1.5);
  });

  it('sets ignoreHTTPSErrors when --ignore-https-errors flag is passed', () => {
    const result = buildShotConfig('https://localhost/', { ignoreHttpsErrors: true }, undefined);
    expect(result.browser?.ignoreHTTPSErrors).toBe(true);
  });

  it('leaves ignoreHTTPSErrors undefined by default', () => {
    const result = buildShotConfig('https://example.com', undefined, undefined);
    expect(result.browser?.ignoreHTTPSErrors).toBeUndefined();
  });

  it('inherits ignoreHTTPSErrors from existing config', () => {
    const result = buildShotConfig(
      'https://localhost/',
      undefined,
      createConfig({ browser: { ignoreHTTPSErrors: true } })
    );
    expect(result.browser?.ignoreHTTPSErrors).toBe(true);
  });

  it('builds screenshot entry with all options', () => {
    const result = buildShotConfig(
      'https://example.com',
      {
        selector: ['.hero'],
        padding: 10,
        output: 'my-shot.png',
      },
      undefined
    );
    const screenshot = result.screenshots[0];
    expect(screenshot?.name).toBe('my-shot');
    expect(screenshot?.selector).toBe('.hero');
    expect(screenshot?.padding).toEqual({ top: 10, right: 10, bottom: 10, left: 10 });
  });
});
