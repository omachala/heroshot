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
  const dir = manifest.outputDirectory;
  const prefix = dir.startsWith('/') ? '' : '/';
  return `${prefix}${dir}/${filename}`;
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

type ColorSchemePaths = { default: string; light?: string; dark?: string };

/**
 * Build paths for color schemes at a specific viewport (or base level)
 */
function buildColorSchemePaths(
  manifest: Manifest,
  screenshot: ScreenshotInfo,
  viewport?: string
): ColorSchemePaths {
  const { colorSchemes } = screenshot;
  const hasColorSchemes = colorSchemes.length > 0;

  const getPath = (colorScheme?: 'light' | 'dark') =>
    generatePath(manifest, screenshot, { viewport, colorScheme });

  const paths: ColorSchemePaths = {
    default: hasColorSchemes ? getPath('light') : getPath(),
  };

  if (colorSchemes.includes('light')) {
    paths.light = getPath('light');
  }
  if (colorSchemes.includes('dark')) {
    paths.dark = getPath('dark');
  }

  return paths;
}

/**
 * Get all paths for a screenshot based on its variants
 */
export function getVariantPaths(manifest: Manifest, screenshot: ScreenshotInfo): VariantPaths {
  const basePaths = buildColorSchemePaths(manifest, screenshot);

  const viewportPaths: VariantPaths['viewports'] = {};
  for (const viewport of screenshot.viewports) {
    viewportPaths[viewport] = buildColorSchemePaths(manifest, screenshot, viewport);
  }

  return {
    ...basePaths,
    viewports: viewportPaths,
  };
}
