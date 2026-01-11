/**
 * Screenshot item stored in the toolbar
 */
export interface ScreenshotItem {
  id: string;
  name: string;
  url: string;
  selector: string;
  createdAt: number; // Unix timestamp for ordering (newest first)
}

/**
 * Browser settings
 */
export interface BrowserSettings {
  viewport: { width: number; height: number };
  colorScheme?: 'light' | 'dark' | 'both';
}

/**
 * Job types that CLI sends to toolbar
 */
export type ToolbarJob =
  | { type: 'highlight'; selector: string }
  | { type: 'navigate-and-highlight'; url: string; selector: string };

/**
 * Event types that toolbar sends to CLI
 */
export type ToolbarEvent =
  | { type: 'screenshot-added'; data: ScreenshotItem }
  | { type: 'screenshot-updated'; data: ScreenshotItem }
  | { type: 'screenshot-selected'; id: string; url: string; selector: string }
  | { type: 'screenshot-removed'; id: string }
  | { type: 'settings-updated'; data: BrowserSettings }
  | { type: 'job-complete' }
  | { type: 'done' };

/**
 * Global heroshot namespace
 */
export interface HeroshotGlobal {
  initialized: boolean;
  screenshots: ScreenshotItem[];
  settings: BrowserSettings;
  pendingJob: ToolbarJob | null;
  emit: (event: ToolbarEvent) => void;
}

/**
 * Extended globalThis interface
 */
declare global {
  var __heroshot: HeroshotGlobal | undefined;
}
