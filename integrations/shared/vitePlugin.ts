/**
 * Vite plugin for heroshot framework integrations.
 *
 * Provides zero-config manifest injection via virtual module.
 *
 * Usage in vite.config.ts or .vitepress/config.ts:
 * ```ts
 * import { heroshot } from 'heroshot/plugins/vite'
 *
 * export default {
 *   vite: { plugins: [heroshot()] }
 * }
 * ```
 *
 * Then components can import manifest automatically:
 * ```ts
 * import manifest from 'virtual:heroshot-manifest'
 * ```
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import type { Manifest } from './types';
import { findConfig, loadManifest, emptyManifest } from './getManifest';

/**
 * Normalize outputDirectory for browser URL
 * Strips 'public/' prefix (VitePress/Vite) since public/ is served as root
 */
function normalizeOutputDirectory(dir: string): string {
  // Strip public/ prefix (VitePress/Vite public directory)
  if (dir.startsWith('public/')) {
    return dir.slice(7);
  }
  return dir;
}

const VIRTUAL_MODULE_ID = 'virtual:heroshot-manifest';
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export interface HeroshotPluginOptions {
  /**
   * Path to config.json (relative to project root)
   * @default auto-detected from heroshot.config.json, heroshots/config.json, etc.
   */
  config?: string;
}

/**
 * Heroshot Vite plugin
 *
 * Auto-discovers config.json and injects manifest as a virtual module.
 */
export function heroshot(options: HeroshotPluginOptions = {}): Plugin {
  let configPath: string | null = null;
  let manifest: Manifest = emptyManifest();

  return {
    name: 'heroshot',

    configResolved(config) {
      const root = config.root;

      // Find or use provided config path
      if (options.config) {
        configPath = resolve(root, options.config);
      } else {
        configPath = findConfig(root);
      }

      // Load manifest from config
      if (configPath && existsSync(configPath)) {
        const loaded = loadManifest(configPath);
        if (loaded) {
          // Normalize outputDirectory for browser URL (strip public/ prefix)
          manifest = {
            ...loaded,
            outputDirectory: normalizeOutputDirectory(loaded.outputDirectory),
          };
          console.log(`[heroshot] Loaded config from ${configPath}`);
        }
      } else {
        console.log('[heroshot] No config found, using empty manifest');
      }
    },

    resolveId(id): string | undefined {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      return undefined;
    },

    load(id): string | undefined {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        // Auto-register manifest when imported (side effect)
        return `import { setManifest } from 'heroshot/vitepress';
const manifest = ${JSON.stringify(manifest, null, 2)};
setManifest(manifest);
export default manifest;`;
      }
      return undefined;
    },

    // Hot reload on config changes
    handleHotUpdate({ file, server }) {
      if (configPath && file === configPath) {
        const loaded = loadManifest(configPath);
        if (loaded) {
          manifest = loaded;
          console.log('[heroshot] Config updated');

          // Invalidate virtual module
          const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload' });
          }
        }
      }
    },
  };
}
