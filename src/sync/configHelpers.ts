/**
 * Configuration and screenshot filtering helpers for sync operations.
 */

import path from 'node:path';
import type { Config, Screenshot } from '../types';
import type { CaptureOptions } from './types';

/**
 * Filter screenshots by pattern (matches id or name - case-insensitive).
 */
export function filterScreenshots(screenshots: Screenshot[], pattern?: string): Screenshot[] {
  if (!pattern) {
    return screenshots;
  }

  const lowerPattern = pattern.toLowerCase();
  return screenshots.filter(
    screenshot =>
      screenshot.id.toLowerCase().includes(lowerPattern) ||
      screenshot.name.toLowerCase().includes(lowerPattern)
  );
}

/**
 * Resolve output directory from config or override.
 */
export function resolveOutputDirectory(
  configPath: string,
  configOutputDirectory: string,
  override?: string
): string {
  if (override) {
    return path.resolve(override);
  }

  const configParentDirectory = path.dirname(configPath);
  const projectRoot = path.dirname(configParentDirectory);
  return path.resolve(projectRoot, configOutputDirectory);
}

/**
 * Calculate total number of captures needed.
 */
export function calculateTotalCaptures(screenshots: Screenshot[], schemeCount: number): number {
  let total = 0;
  const adjustedSchemeCount = Math.max(1, schemeCount);

  for (const screenshot of screenshots) {
    const viewportCount = screenshot.viewports?.length ?? 1;
    total += viewportCount * adjustedSchemeCount;
  }

  return total;
}

/**
 * Build capture options from config.
 */
export function buildCaptureOptions(config: Config, viewportOnly?: boolean): CaptureOptions {
  return {
    format: config.outputFormat ?? 'png',
    quality: config.jpegQuality,
    fullPage: !viewportOnly,
    hiddenElements: config.hiddenElements,
  };
}

/**
 * Build browser options from config.
 */
export function buildBrowserOptions(config: Config) {
  return {
    viewport: config.browser?.viewport ?? { width: 1280, height: 800 },
    deviceScaleFactor: config.browser?.deviceScaleFactor,
    bypassCSP: config.browser?.bypassCSP,
    reducedMotion: config.browser?.reducedMotion,
    userAgent: config.browser?.userAgent,
  };
}
