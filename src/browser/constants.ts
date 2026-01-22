import path from 'node:path';
import type { Viewport } from '../types';

/** Default viewport dimensions */
export const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 };

/** Path to editor directory */
export const EDITOR_DIR = path.join(import.meta.dirname, '..', '..', 'editor');
