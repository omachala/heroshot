import path from 'node:path';
import type { Viewport } from '../types';

/** Default viewport dimensions */
export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 };

/**
 * Browser channels to try in order of preference.
 * System Chrome first (no download needed), then Playwright's bundled Chromium.
 */
export const BROWSER_CHANNELS: readonly string[] = ['chrome', 'chromium'];

/** Path to editor directory */
export const EDITOR_DIR = path.join(import.meta.dirname, '..', '..', 'editor');
