/**
 * Pure config-to-manifest transformation (no Node.js APIs).
 * Safe for use in browser contexts (e.g., Next.js client components).
 */

import type { Manifest, ScreenshotInfo } from './types';

export type { Manifest, ScreenshotInfo } from './types';

/**
 * Raw config.json structure (subset of fields we need)
 */
export interface ConfigJson {
  outputDirectory?: string;
  outputFormat?: 'png' | 'jpeg';
  browser?: {
    colorScheme?: 'light' | 'dark';
  };
  screenshots: Array<{
    id: string;
    name: string;
    viewports?: string[];
  }>;
}

/**
 * Slugify a single path segment for use in filenames
 */
function slugifySegment(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(?:^-|-$)/g, '');
}

/**
 * Slugify a string for use in filenames.
 * Preserves forward slashes to support subdirectory output paths.
 */
function slugify(text: string): string {
  return text.split('/').map(slugifySegment).filter(Boolean).join('/');
}

/**
 * Determine color schemes from config
 */
function getColorSchemes(colorScheme?: 'light' | 'dark'): ('light' | 'dark')[] {
  if (colorScheme === 'light') return ['light'];
  if (colorScheme === 'dark') return ['dark'];
  return ['light', 'dark']; // default: both
}

/**
 * Transform config.json into manifest structure.
 *
 * This is a pure function - no file system access needed.
 * Use it when you already have the config object in memory.
 */
export function configToManifest(config: ConfigJson): Manifest {
  const colorSchemes = getColorSchemes(config.browser?.colorScheme);
  const format = config.outputFormat ?? 'png';
  const outputDirectory = config.outputDirectory ?? 'heroshots';

  const screenshots: Record<string, ScreenshotInfo> = {};

  for (const screenshot of config.screenshots) {
    screenshots[screenshot.name] = {
      slug: slugify(screenshot.name),
      viewports: screenshot.viewports ?? [],
      colorSchemes,
      format,
    };
  }

  return {
    version: 1,
    outputDirectory,
    screenshots,
  };
}
