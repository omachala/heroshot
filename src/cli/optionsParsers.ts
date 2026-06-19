import { VIEWPORT_PRESETS } from '../schema';
import type { Config, ShotCommandOptions } from '../types';

/**
 * Get color scheme from CLI options.
 * For oneshot mode, defaults to light-only.
 * For config sync, defaults to both variants.
 */
export function getColorScheme(
  options: ShotCommandOptions | undefined,
  bothVariants: boolean
): 'light' | 'dark' | undefined {
  if (options?.dark && options?.light) return undefined; // Both flags = both variants
  if (options?.dark) return 'dark';
  if (options?.light) return 'light';
  // Default: light-only for oneshot, both variants for config sync
  return bothVariants ? undefined : 'light';
}

/**
 * Get device scale factor from CLI options.
 * Checks --retina flag, --scale option, then falls back to existing config.
 */
export function getDeviceScaleFactor(
  options: ShotCommandOptions | undefined,
  existingConfig: Config | undefined
): number | undefined {
  if (options?.retina) return 2;
  if (options?.scale) return options.scale;
  return existingConfig?.browser?.deviceScaleFactor;
}

/**
 * Build browser settings for a oneshot capture from CLI options,
 * falling back to existing config defaults.
 */
export function buildBrowserSettings(
  options: ShotCommandOptions | undefined,
  existingConfig: Config | undefined
): NonNullable<Config['browser']> {
  return {
    viewport: getViewport(options, existingConfig),
    colorScheme: getColorScheme(options, false), // false = oneshot mode, default to light-only
    deviceScaleFactor: getDeviceScaleFactor(options, existingConfig),
    reducedMotion: options?.reducedMotion ? 'reduce' : existingConfig?.browser?.reducedMotion,
    userAgent: options?.userAgent ?? existingConfig?.browser?.userAgent,
    ignoreHTTPSErrors: options?.ignoreHttpsErrors ?? existingConfig?.browser?.ignoreHTTPSErrors,
  };
}

/**
 * Get viewport from CLI options.
 * Checks preset flags (mobile/tablet/desktop), custom dimensions, then existing config.
 */
// eslint-disable-next-line complexity -- handles multiple viewport sources
export function getViewport(
  options: ShotCommandOptions | undefined,
  existingConfig: Config | undefined
): { width: number; height: number } | undefined {
  // Check preset flags first
  if (options?.mobile) return VIEWPORT_PRESETS.mobile;
  if (options?.tablet) return VIEWPORT_PRESETS.tablet;
  if (options?.desktop) return VIEWPORT_PRESETS.desktop;

  // Check custom dimensions
  if (options?.width || options?.height) {
    const base = existingConfig?.browser?.viewport;
    return {
      width: options?.width ?? base?.width ?? 1280,
      height: options?.height ?? base?.height ?? 800,
    };
  }

  return existingConfig?.browser?.viewport;
}
