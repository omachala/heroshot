import { existsSync } from 'node:fs';
import path from 'node:path';
import type { Viewport } from '../types';

/** Default viewport dimensions */
export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 };

/**
 * Find package root by looking for package.json
 * Works both in source (src/browser/) and bundled (dist/) contexts
 */
function findPackageRoot(startDirectory: string): string {
  let directory = startDirectory;
  for (let depth = 0; depth < 5; depth++) {
    if (existsSync(path.join(directory, 'package.json'))) {
      return directory;
    }
    directory = path.dirname(directory);
  }
  // Fallback to startDirectory if not found
  return startDirectory;
}

/** Path to editor directory */
export const EDITOR_DIR = path.join(findPackageRoot(import.meta.dirname), 'editor');
