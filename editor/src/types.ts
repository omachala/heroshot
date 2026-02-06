/**
 * Padding around element (expands capture area)
 */
export type Padding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

/**
 * Scroll position at time of capture
 */
export type ScrollPosition = {
  x: number;
  y: number;
};

/**
 * Background fill mode for padding area
 * - 'inherit': show actual page content (default)
 * - 'solid': fill with detected background color
 * - 'transparent': fully transparent (PNG only)
 */
export type PaddingFill = 'inherit' | 'solid' | 'transparent';

/**
 * Background fill mode for element area
 * - 'original': keep element's actual background (default)
 * - 'solid': replace with detected background color
 * - 'transparent': fully transparent (PNG only)
 */
export type ElementFill = 'original' | 'solid' | 'transparent';

/**
 * Visual annotation drawn over a screenshot
 */
export type Annotation = {
  id: string;
  type: string; // 'arrow' | 'rect' | 'ellipse'
  points: number[]; // geometry - meaning depends on type
  style?: Record<string, string | number>; // any CSS/SVG properties
};

/**
 * Screenshot item stored in the toolbar
 */
export type ScreenshotItem = {
  id: string;
  name: string;
  url: string;
  selector: string;
  createdAt: number; // Unix timestamp for ordering (newest first)
  padding?: Padding;
  /** Scroll position to restore when capturing */
  scroll?: ScrollPosition;
  /** Background fill mode for padding area */
  paddingFill?: PaddingFill;
  /** Background fill mode for element area */
  elementFill?: ElementFill;
  /** Viewport variants - generates screenshot for each (e.g., ["desktop", "mobile", "400x500"]) */
  viewports?: string[];
  /** Text overrides - selector (relative to main element) -> replacement text */
  textOverrides?: Record<string, string>;
  /** Visual annotations drawn over the screenshot */
  annotations?: Annotation[];
};

/**
 * Color scheme for light/dark mode
 * 'light'/'dark' = explicit, undefined = capture both
 */
export type ColorScheme = 'light' | 'dark';

/**
 * Browser settings
 */
export type BrowserSettings = {
  viewport: { width: number; height: number };
  colorScheme?: ColorScheme;
  /** Device scale factor for retina/high-DPI screenshots (1 = standard, 2 = retina) */
  deviceScaleFactor?: number;
};

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
 * Utility functions exposed for sync script
 */
export type HeroshotUtilities = {
  getBackgroundColor: (element: Element) => string;
};

/**
 * Global heroshot namespace
 */
export type HeroshotGlobal = {
  initialized: boolean;
  screenshots: ScreenshotItem[];
  settings: BrowserSettings;
  pendingJob: ToolbarJob | null;
  /** ID of selected screenshot (for cross-URL navigation persistence) */
  selectedId: string | null;
  /** Whether sidebar should be open on init */
  sidebarVisible: boolean;
  emit: (event: ToolbarEvent) => void;
  /** Utility functions for sync script */
  utils?: HeroshotUtilities;
};

/**
 * Extended globalThis interface
 */
declare global {
  var __heroshot: HeroshotGlobal | undefined;
}
