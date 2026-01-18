/**
 * Docusaurus plugin for heroshot framework integration.
 *
 * Provides zero-config manifest injection via webpack alias.
 *
 * Usage in docusaurus.config.js:
 * ```js
 * const { heroshot } = require('heroshot/plugins/docusaurus');
 *
 * module.exports = {
 *   plugins: [heroshot()],
 * };
 * ```
 *
 * Then components can import manifest automatically:
 * ```ts
 * import manifest from '@heroshot/manifest';
 * ```
 */

import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import type { Manifest } from './types';
import { findConfig, loadManifest, emptyManifest } from './getManifest';

/**
 * Normalize outputDirectory for browser URL
 * Strips 'static/' prefix (Docusaurus) since static/ is served as root
 */
function normalizeOutputDirectory(dir: string): string {
  // Strip static/ prefix (Docusaurus static directory)
  if (dir.startsWith('static/')) {
    return dir.slice(7);
  }
  return dir;
}

// Minimal types to avoid @docusaurus/types dependency
interface LoadContext {
  siteDir: string;
  generatedFilesDir: string;
}

interface Plugin {
  name: string;
  configureWebpack?: () => { resolve?: { alias?: Record<string, string> } };
  getPathsToWatch?: () => string[];
}

export interface HeroshotPluginOptions {
  /**
   * Path to config.json (relative to site directory)
   * @default auto-detected from heroshot.config.json, heroshots/config.json, etc.
   */
  config?: string;
}

/**
 * Heroshot Docusaurus plugin
 *
 * Auto-discovers config.json and injects manifest via webpack alias.
 */
export function heroshot(options: HeroshotPluginOptions = {}): Plugin {
  return function heroshotPlugin(context: LoadContext): Plugin {
    const { siteDir, generatedFilesDir } = context;

    // Find or use provided config path
    let configPath: string | null = null;
    if (options.config) {
      configPath = resolve(siteDir, options.config);
    } else {
      configPath = findConfig(siteDir);
    }

    // Load manifest from config
    let manifest: Manifest = emptyManifest();
    if (configPath && existsSync(configPath)) {
      const loaded = loadManifest(configPath);
      if (loaded) {
        // Normalize outputDirectory for browser URL (strip static/ prefix)
        manifest = {
          ...loaded,
          outputDirectory: normalizeOutputDirectory(loaded.outputDirectory),
        };
        console.log(`[heroshot] Loaded config from ${configPath}`);
      }
    } else {
      console.log('[heroshot] No config found, using empty manifest');
    }

    // Write manifest to generated files for webpack to resolve
    const generatedManifestPath = join(generatedFilesDir, 'heroshot-manifest.json');
    mkdirSync(dirname(generatedManifestPath), { recursive: true });
    writeFileSync(generatedManifestPath, JSON.stringify(manifest, null, 2));

    // Generate client module that auto-registers manifest
    const clientModulePath = join(generatedFilesDir, 'heroshot-client.js');
    writeFileSync(
      clientModulePath,
      `import { setManifest } from 'heroshot/docusaurus';
import manifest from '@heroshot/manifest';
setManifest(manifest);
`
    );

    return {
      name: 'heroshot',

      configureWebpack() {
        return {
          resolve: {
            alias: {
              '@heroshot/manifest': generatedManifestPath,
            },
          },
        };
      },

      getClientModules() {
        return [clientModulePath];
      },

      getPathsToWatch() {
        // Watch config file for changes
        return configPath ? [configPath] : [];
      },
    };
  };
}
