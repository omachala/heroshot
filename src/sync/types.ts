import type { BrowserContextOptions, ElementHandle, Page } from 'playwright';
import type { Config } from '../types';

/** Browser context options shared across capture paths (sequential and parallel) */
export type BrowserCaptureOptions = {
  viewport: { width: number; height: number };
  deviceScaleFactor?: number;
  storageState?: BrowserContextOptions['storageState'];
  bypassCSP?: boolean;
  reducedMotion?: 'reduce' | 'no-preference';
  userAgent?: string;
  /** Ignore TLS certificate errors (self-signed certs, custom CA) */
  ignoreHTTPSErrors?: boolean;
  headed?: boolean;
};

/** Options for taking a screenshot */
export type TakeScreenshotOptions = {
  target: Page | ElementHandle;
  outputPath: string;
  format: 'png' | 'jpeg';
  quality: number;
  clip?: { x: number; y: number; width: number; height: number };
  omitBackground?: boolean;
  /** Capture full page (default true) or just viewport */
  fullPage?: boolean;
};

/** Options for capturing output */
export type CaptureOptions = {
  /** Output format (png or jpeg) */
  format: 'png' | 'jpeg';
  /** JPEG quality (1-100) */
  quality: number;
  /** Capture full page (default true) or just viewport */
  fullPage?: boolean;
  /** Elements to hide per domain (hostname → CSS selectors) */
  hiddenElements?: Record<string, string[]>;
};

/** Options for element screenshot capture */
export type ElementCaptureOptions = {
  page: Page;
  element: ElementHandle;
  selector: string;
  outputPath: string;
  format: 'png' | 'jpeg';
  quality: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  /** Background fill mode for padding area */
  paddingFill?: 'inherit' | 'solid' | 'transparent';
  /** Background fill mode for element area */
  elementFill?: 'original' | 'solid' | 'transparent';
  /** Annotations to render over the element */
  annotations?: { type: string; points: number[]; style?: Record<string, string | number> }[];
  /** Border width in pixels */
  borderWidth?: number;
  /** Border color (hex) */
  borderColor?: string;
  /** Corner radius in pixels — clips screenshot to rounded rect with transparent corners */
  borderRadius?: number;
};

/** Variant options for screenshot capture */
export type CaptureVariant = {
  /** Viewport name for filename suffix (only if multiple viewports) */
  viewportName?: string;
  /** Color scheme for filename suffix (only if multiple schemes) */
  colorScheme?: 'light' | 'dark';
  /** Locale code for output subdirectory (only if multiple locales) */
  locale?: string;
  /** URL with {locale} placeholder replaced (used for navigation) */
  localeUrl?: string;
};

/** Result of a single screenshot capture */
export type ScreenshotResult = {
  id: string;
  name: string;
  filename: string;
  success: boolean;
  error?: string;
};

/** Result of sync operation */
export type SyncResult = {
  total: number;
  success: number;
  failed: number;
  results: ScreenshotResult[];
  staleFiles?: string[];
  deletedFiles?: string[];
};

/** Options for sync operation */
export type SyncOptions = {
  /** Pattern to filter screenshots by id or name (case-insensitive substring match) */
  filter?: string;
  /** Path to config file (loads config from file) */
  configPath?: string;
  /** Config object (use directly, skip file loading) */
  config?: Config;
  /** Output directory override (for URL capture mode where there's no config file) */
  outputDirectory?: string;
  sessionKey?: string;
  /** Delete stale files in output directory (only works when running full sync without filter) */
  clean?: boolean;
  /** Skip stale file detection (for oneshot mode) */
  skipStaleCheck?: boolean;
  /** Capture only viewport instead of full page (oneshot mode) */
  viewportOnly?: boolean;
  /** Number of parallel capture workers (default: 1) */
  workers?: number;
  /** Run browser in headed mode (visible window) for debugging */
  headed?: boolean;
};

/** Padding dimensions */
export type Padding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};
