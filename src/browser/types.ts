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
  elementFill?: 'original' | 'solid' | 'transparent';
  textOverrides?: Record<string, string>;
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
};

/** Events that toolbar sends to CLI */
export type ToolbarEvent =
  | { type: 'screenshot-added'; data: ScreenshotData }
  | { type: 'screenshot-updated'; data: ScreenshotData }
  | { type: 'screenshot-selected'; id: string; url: string; selector: string }
  | { type: 'screenshot-removed'; id: string }
  | { type: 'settings-updated'; data: BrowserSettings }
  | { type: 'job-complete' }
  | { type: 'done' };

/** Options for injecting toolbar into page */
export type InjectToolbarOptions = {
  screenshots: ScreenshotData[];
  pendingJob: ToolbarJob | null;
  selectedId: string | null;
  sidebarExpanded: boolean;
  onEvent: (event: ToolbarEvent) => void;
};

/** Options for setup command */
export type SetupOptions = {
  /** Force browser color scheme (light/dark) for testing */
  colorScheme?: 'light' | 'dark';
};
