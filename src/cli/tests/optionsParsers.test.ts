import { describe, expect, it } from 'vitest';
import type { Config } from '../../types';
import { getColorScheme, getDeviceScaleFactor, getViewport } from '../optionsParsers';

/** Helper to create a minimal Config for testing */
function createConfig(overrides: Partial<Config> = {}): Config {
  return {
    outputDirectory: '.',
    jpegQuality: 80,
    screenshots: [],
    ...overrides,
  };
}

describe('getColorScheme', () => {
  it('returns undefined when both dark and light flags are set', () => {
    const result = getColorScheme({ dark: true, light: true }, false);
    expect(result).toBeUndefined();
  });

  it('returns dark when only dark flag is set', () => {
    const result = getColorScheme({ dark: true }, false);
    expect(result).toBe('dark');
  });

  it('returns light when only light flag is set', () => {
    const result = getColorScheme({ light: true }, false);
    expect(result).toBe('light');
  });

  it('returns light for oneshot mode (bothVariants=false) with no flags', () => {
    const result = getColorScheme({}, false);
    expect(result).toBe('light');
  });

  it('returns undefined for config sync (bothVariants=true) with no flags', () => {
    const result = getColorScheme({}, true);
    expect(result).toBeUndefined();
  });

  it('handles undefined options', () => {
    expect(getColorScheme(undefined, false)).toBe('light');
    expect(getColorScheme(undefined, true)).toBeUndefined();
  });
});

describe('getDeviceScaleFactor', () => {
  it('returns 2 when retina flag is set', () => {
    const result = getDeviceScaleFactor({ retina: true }, undefined);
    expect(result).toBe(2);
  });

  it('returns scale option value', () => {
    const result = getDeviceScaleFactor({ scale: 3 }, undefined);
    expect(result).toBe(3);
  });

  it('prefers retina over scale option', () => {
    const result = getDeviceScaleFactor({ retina: true, scale: 3 }, undefined);
    expect(result).toBe(2);
  });

  it('falls back to existing config', () => {
    const result = getDeviceScaleFactor({}, createConfig({ browser: { deviceScaleFactor: 1.5 } }));
    expect(result).toBe(1.5);
  });

  it('returns undefined when no option and no config', () => {
    const result = getDeviceScaleFactor({}, undefined);
    expect(result).toBeUndefined();
  });

  it('handles undefined options', () => {
    const result = getDeviceScaleFactor(undefined, undefined);
    expect(result).toBeUndefined();
  });
});

describe('getViewport', () => {
  it('returns mobile preset', () => {
    const result = getViewport({ mobile: true }, undefined);
    expect(result).toEqual({ width: 430, height: 932 });
  });

  it('returns tablet preset', () => {
    const result = getViewport({ tablet: true }, undefined);
    expect(result).toEqual({ width: 768, height: 1024 });
  });

  it('returns desktop preset', () => {
    const result = getViewport({ desktop: true }, undefined);
    expect(result).toEqual({ width: 1280, height: 800 });
  });

  it('returns custom width with default height', () => {
    const result = getViewport({ width: 1920 }, undefined);
    expect(result).toEqual({ width: 1920, height: 800 });
  });

  it('returns custom height with default width', () => {
    const result = getViewport({ height: 1080 }, undefined);
    expect(result).toEqual({ width: 1280, height: 1080 });
  });

  it('returns custom dimensions from options', () => {
    const result = getViewport({ width: 1920, height: 1080 }, undefined);
    expect(result).toEqual({ width: 1920, height: 1080 });
  });

  it('uses existing config as base for partial dimensions', () => {
    const result = getViewport(
      { width: 1920 },
      createConfig({ browser: { viewport: { width: 800, height: 600 } } })
    );
    expect(result).toEqual({ width: 1920, height: 600 });
  });

  it('falls back to existing config viewport', () => {
    const result = getViewport(
      {},
      createConfig({ browser: { viewport: { width: 1024, height: 768 } } })
    );
    expect(result).toEqual({ width: 1024, height: 768 });
  });

  it('returns undefined when no option and no config', () => {
    const result = getViewport({}, undefined);
    expect(result).toBeUndefined();
  });

  it('handles undefined options', () => {
    const result = getViewport(undefined, undefined);
    expect(result).toBeUndefined();
  });

  it('prefers preset over custom dimensions', () => {
    const result = getViewport({ mobile: true, width: 1920 }, undefined);
    expect(result).toEqual({ width: 430, height: 932 });
  });
});
