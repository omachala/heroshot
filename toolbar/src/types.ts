/**
 * Padding around element (expands capture area)
 */
export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Scroll position at time of capture
 */
export interface ScrollPosition {
  x: number;
  y: number;
}

/**
 * Screenshot item stored in the toolbar
 */
export interface ScreenshotItem {
  id: string;
  name: string;
  url: string;
  selector: string;
  createdAt: number; // Unix timestamp for ordering (newest first)
  padding?: Padding;
  /** Scroll position to restore when capturing */
  scroll?: ScrollPosition;
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
  | { type: 'highlight'; selector: string; screenshotId?: string }
  | { type: 'navigate-and-highlight'; url: string; selector: string; screenshotId?: string };

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
  /** ID of selected screenshot (for cross-URL navigation persistence) */
  selectedId: string | null;
  /** Whether sidebar should be open on init */
  sidebarVisible: boolean;
  emit: (event: ToolbarEvent) => void;
}

/**
 * Extended globalThis interface
 */
declare global {
  var __heroshot: HeroshotGlobal | undefined;
}
