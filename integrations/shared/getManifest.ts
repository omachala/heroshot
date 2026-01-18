/**
 * Transform config.json into manifest structure for components.
 *
 * This eliminates the need for a separate manifest.json file -
 * we read config.json directly and extract what the component needs.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Manifest, ScreenshotInfo } from './types';

/**
 * Raw config.json structure (subset of fields we need)
 */
interface ConfigJson {
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
 * Slugify a string for use in filenames
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(?:^-|-$)/g, '');
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
 * Standard locations to search for config.json
 */
const CONFIG_LOCATIONS = ['heroshot.config.json', 'heroshots/config.json', '.heroshot/config.json'];

/**
 * Find config.json in standard locations
 */
export function findConfig(root: string): string | null {
  for (const loc of CONFIG_LOCATIONS) {
    const fullPath = resolve(root, loc);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

/**
 * Transform config.json into manifest structure
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

/**
 * Load config.json and transform to manifest
 */
export function loadManifest(configPath: string): Manifest | null {
  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as ConfigJson;

    if (!config.screenshots || !Array.isArray(config.screenshots)) {
      console.warn('[heroshot] Invalid config: missing screenshots array');
      return null;
    }

    return configToManifest(config);
  } catch (error) {
    console.warn('[heroshot] Failed to load config:', error);
    return null;
  }
}

/**
 * Create empty manifest for when no config exists yet
 */
export function emptyManifest(): Manifest {
  return {
    version: 1,
    outputDirectory: 'heroshots',
    screenshots: {},
  };
}
