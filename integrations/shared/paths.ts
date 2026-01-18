/**
 * Path generation utilities for heroshot framework integrations.
 * Generates image paths from manifest data.
 */

import type { Manifest, ScreenshotInfo } from './types';

/**
 * Get screenshot entry from manifest by name
 */
export function getScreenshot(manifest: Manifest, name: string): ScreenshotInfo | undefined {
  return manifest.screenshots[name];
}

/**
 * Generate filename from screenshot entry and variant
 */
export function generateFilename(
  screenshot: ScreenshotInfo,
  options: {
    viewport?: string;
    colorScheme?: 'light' | 'dark';
  } = {}
): string {
  const { slug, format } = screenshot;
  const { viewport, colorScheme } = options;

  const parts = [slug];

  if (viewport) {
    parts.push(viewport);
  }

  if (colorScheme) {
    parts.push(colorScheme);
  }

  const extension = format === 'jpeg' ? 'jpg' : 'png';
  return `${parts.join('-')}.${extension}`;
}

/**
 * Generate full path from manifest and screenshot entry
 */
export function generatePath(
  manifest: Manifest,
  screenshot: ScreenshotInfo,
  options: {
    viewport?: string;
    colorScheme?: 'light' | 'dark';
  } = {}
): string {
  const filename = generateFilename(screenshot, options);
  return `${manifest.outputDirectory}/${filename}`;
}

/**
 * Get all variant paths for a screenshot
 */
export type VariantPaths = {
  /** Default path (first variant or base) */
  default: string;
  /** Light mode path (if available) */
  light?: string;
  /** Dark mode path (if available) */
  dark?: string;
  /** Viewport-specific paths */
  viewports: Record<
    string,
    {
      default: string;
      light?: string;
      dark?: string;
    }
  >;
};

/**
 * Get all paths for a screenshot based on its variants
 */
export function getVariantPaths(manifest: Manifest, screenshot: ScreenshotInfo): VariantPaths {
  const { colorSchemes, viewports } = screenshot;
  const hasColorSchemes = colorSchemes.length > 0;
  const hasViewports = viewports.length > 0;

  // Helper to get path with optional color scheme
  const getPath = (viewport?: string, colorScheme?: 'light' | 'dark') =>
    generatePath(manifest, screenshot, { viewport, colorScheme });

  // Base paths (no viewport)
  const basePaths: { default: string; light?: string; dark?: string } = {
    default: hasColorSchemes ? getPath(undefined, 'light') : getPath(),
  };

  if (hasColorSchemes) {
    if (colorSchemes.includes('light')) {
      basePaths.light = getPath(undefined, 'light');
    }
    if (colorSchemes.includes('dark')) {
      basePaths.dark = getPath(undefined, 'dark');
    }
  }

  // Viewport-specific paths
  const viewportPaths: VariantPaths['viewports'] = {};

  if (hasViewports) {
    for (const viewport of viewports) {
      viewportPaths[viewport] = {
        default: hasColorSchemes ? getPath(viewport, 'light') : getPath(viewport),
      };

      if (hasColorSchemes) {
        if (colorSchemes.includes('light')) {
          viewportPaths[viewport].light = getPath(viewport, 'light');
        }
        if (colorSchemes.includes('dark')) {
          viewportPaths[viewport].dark = getPath(viewport, 'dark');
        }
      }
    }
  }

  return {
    ...basePaths,
    viewports: viewportPaths,
  };
}
