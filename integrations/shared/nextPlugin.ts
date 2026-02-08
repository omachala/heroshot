/**
 * Next.js plugin for heroshot framework integration.
 *
 * Provides a config wrapper that injects manifest via webpack alias.
 *
 * Usage in next.config.js (webpack mode):
 * ```js
 * const { withHeroshot } = require('heroshot/plugins/next');
 *
 * module.exports = withHeroshot({
 *   // ... your Next.js config
 * });
 * ```
 *
 * For Turbopack mode (Next.js 15+ default), use manual setup:
 * ```tsx
 * // app/layout.tsx
 * import { setManifest } from 'heroshot/next';
 * import { configToManifest } from 'heroshot';
 * import config from '../.heroshot/config.json';
 * setManifest(configToManifest(config));
 * ```
 */

import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { Manifest } from './types';
import { findConfig, loadManifest, emptyManifest } from './getManifest';

/**
 * Normalize outputDirectory for browser URL
 * Strips 'public/' prefix (Next.js) since public/ is served as root
 */
function normalizeOutputDirectory(dir: string): string {
  if (dir.startsWith('public/')) {
    return dir.slice(7);
  }
  return dir;
}

export interface WithHeroshotOptions {
  /**
   * Path to config.json (relative to project root)
   * @default auto-detected from heroshot.config.json, heroshots/config.json, etc.
   */
  config?: string;
}

// Minimal Next.js config types to avoid @next/core dependency
interface WebpackConfig {
  resolve?: {
    alias?: Record<string, string>;
  };
}

interface WebpackOptions {
  isServer: boolean;
}

interface NextConfig {
  webpack?: (config: WebpackConfig, options: WebpackOptions) => WebpackConfig;
  [key: string]: unknown;
}

/**
 * Heroshot Next.js config wrapper
 *
 * Wraps your Next.js config to inject manifest via webpack alias.
 * Works with webpack mode. For Turbopack, use manual setManifest().
 */
export function withHeroshot(
  nextConfig: NextConfig = {},
  options: WithHeroshotOptions = {}
): NextConfig {
  return {
    ...nextConfig,
    webpack(config: WebpackConfig, webpackOptions: WebpackOptions) {
      const root = process.cwd();

      // Find or use provided config path
      let configPath: string | null = null;
      if (options.config) {
        configPath = resolve(root, options.config);
      } else {
        configPath = findConfig(root);
      }

      // Load manifest from config
      let manifest: Manifest = emptyManifest();
      if (configPath && existsSync(configPath)) {
        const loaded = loadManifest(configPath);
        if (loaded) {
          manifest = {
            ...loaded,
            outputDirectory: normalizeOutputDirectory(loaded.outputDirectory),
          };
          console.log(`[heroshot] Loaded config from ${configPath}`);
        }
      } else {
        console.log('[heroshot] No config found, using empty manifest');
      }

      // Write manifest to a temp file for webpack to resolve
      const generatedDir = join(root, 'node_modules', '.heroshot');
      mkdirSync(generatedDir, { recursive: true });

      const manifestPath = join(generatedDir, 'manifest.json');
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      // Write client module that auto-registers manifest
      const clientModulePath = join(generatedDir, 'client.js');
      writeFileSync(
        clientModulePath,
        `import { setManifest } from 'heroshot/next';
import manifest from './manifest.json';
setManifest(manifest);
export default manifest;
`
      );

      // Add webpack alias
      config.resolve ??= {};
      config.resolve.alias ??= {};
      config.resolve.alias['@heroshot/manifest'] = manifestPath;
      config.resolve.alias['virtual:heroshot-manifest'] = clientModulePath;

      // Call user's webpack config if provided
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, webpackOptions);
      }

      return config;
    },
  };
}
