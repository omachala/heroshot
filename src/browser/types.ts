import type { BrowserContextOptions } from 'playwright';
import type { Viewport } from '../types';

/** Options for launching a browser */
export type LaunchOptions = {
  headless?: boolean;
  viewport?: Viewport;
  deviceScaleFactor?: number;
  storageState?: BrowserContextOptions['storageState'];
  colorScheme?: 'light' | 'dark';
  /** Bypass Content-Security-Policy. Defaults to true for reliable page.evaluate() */
  bypassCSP?: boolean;
  /** Emulate prefers-reduced-motion media feature */
  reducedMotion?: 'reduce' | 'no-preference';
  /** Custom user agent string */
  userAgent?: string;
  /** Ignore TLS certificate errors (self-signed certs, custom CA) */
  ignoreHTTPSErrors?: boolean;
  /** Browser locale (e.g., "de", "fr"). Sets Accept-Language header too. */
  locale?: string;
};

/** Internal screenshot data used by toolbar */
export type ScreenshotData = {
  id: string;
  name: string;
  url: string;
  selector: string;
  createdAt: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scroll?: {
    x: number;
    y: number;
  };
  paddingFill?: 'inherit' | 'solid' | 'transparent';
  paddingColor?: string;
  elementFill?: 'original' | 'solid' | 'transparent';
  elementColor?: string;
  textOverrides?: Record<string, string>;
  annotations?: {
    id: string;
    type: string;
    points: number[];
    style?: Record<string, string | number>;
  }[];
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
};

/** Job types that CLI can send to toolbar */
export type ToolbarJob =
  | { type: 'highlight'; selector: string; screenshotId?: string }
  | { type: 'navigate-and-highlight'; url: string; selector: string; screenshotId?: string };

/** Browser settings from toolbar */
export type BrowserSettings = {
  viewport: { width: number; height: number };
  colorScheme?: 'light' | 'dark';
  deviceScaleFactor?: number;
  /** Output directory for screenshots (relative to config file) */
  outputDirectory?: string;
  /** Image format for all screenshots */
  outputFormat?: 'png' | 'jpeg';
  /** JPEG compression quality (1-100) */
  jpegQuality?: number;
  /** Number of parallel capture workers */
  workers?: number;
};

/** Events that toolbar sends to CLI */
export type ToolbarEvent =
  | { type: 'screenshot-added'; data: ScreenshotData }
  | { type: 'screenshot-updated'; data: ScreenshotData }
  | { type: 'screenshot-selected'; id: string; url: string; selector: string }
  | { type: 'screenshot-removed'; id: string }
  | { type: 'settings-updated'; data: BrowserSettings }
  | { type: 'hidden-elements-updated'; domain: string; selectors: string[] }
  | { type: 'job-complete' }
  | { type: 'done' };

/** Options for injecting toolbar into page */
export type InjectToolbarOptions = {
  screenshots: ScreenshotData[];
  settings: BrowserSettings;
  pendingJob: ToolbarJob | null;
  selectedId: string | null;
  sidebarExpanded: boolean;
  hiddenElements: Record<string, string[]>;
  onEvent: (event: ToolbarEvent) => void;
};

/** Options for setup command */
export type SetupOptions = {
  /** Force browser color scheme (light/dark) for testing */
  colorScheme?: 'light' | 'dark';
};
