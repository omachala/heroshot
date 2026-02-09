/**
 * Config loading utilities (Node.js APIs - for build tools and plugins).
 *
 * For the pure config-to-manifest transform, see configTransform.ts.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Manifest } from './types';
import { configToManifest, type ConfigJson } from './configTransform';

export { configToManifest } from './configTransform';
export type { ConfigJson } from './configTransform';

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
