/**
 * Editor Injection Utility
 *
 * Injects the compiled editor script into a Playwright page for e2e testing.
 * Sets up event capturing to verify editor behavior.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from 'playwright/test';

const currentDir = dirname(fileURLToPath(import.meta.url));
const EDITOR_SCRIPT_PATH = resolve(currentDir, '../../dist/editor.js');

export const TEST_PAGE_URL = 'https://heroshot.sh/__tests__/toolbar.html';

/**
 * Screenshot item for testing
 */
export interface ScreenshotItem {
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
}

/**
 * Browser settings for toolbar
 */
export interface BrowserSettings {
  viewport: { width: number; height: number };
  colorScheme?: 'light' | 'dark' | 'both';
}

/**
 * Event types emitted by toolbar
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
 * Options for injecting the toolbar
 */
export interface InjectOptions {
  screenshots?: ScreenshotItem[];
  pendingJob?: { type: string; selector: string; url?: string; screenshotId?: string } | null;
  /** ID of the selected screenshot (for cross-URL navigation) */
  selectedId?: string | null;
  /** Whether sidebar should be open on init */
  sidebarVisible?: boolean;
}

/**
 * Inject the toolbar into the page with optional config
 */
export async function injectToolbar(page: Page, options: InjectOptions = {}): Promise<void> {
  const script = readFileSync(EDITOR_SCRIPT_PATH, 'utf-8');
  const {
    screenshots = [],
    pendingJob = null,
    selectedId = null,
    sidebarVisible = false,
  } = options;

  await page.evaluate(
    ({
      scriptContent,
      initialScreenshots,
      initialJob,
      initialSelectedId,
      initialSidebarVisible,
    }) => {
      // Create event store
      (window as any).__capturedEvents = [];

      // Set up the global namespace
      (globalThis as any).__heroshot = {
        initialized: false,
        screenshots: initialScreenshots,
        settings: { viewport: { width: 1280, height: 800 } },
        pendingJob: initialJob,
        selectedId: initialSelectedId,
        sidebarVisible: initialSidebarVisible,
        emit: (event: any) => {
          (window as any).__capturedEvents.push(event);
          console.log('[Heroshot Event]', JSON.stringify(event));
        },
      };

      // Inject and execute the toolbar script
      const scriptEl = document.createElement('script');
      scriptEl.textContent = scriptContent;
      document.body.appendChild(scriptEl);
    },
    {
      scriptContent: script,
      initialScreenshots: screenshots,
      initialJob: pendingJob,
      initialSelectedId: selectedId,
      initialSidebarVisible: sidebarVisible,
    }
  );

  // Wait for toolbar to initialize
  await page.waitForTimeout(300);
}

/**
 * Get all captured events from the page
 */
export async function getEvents(page: Page): Promise<ToolbarEvent[]> {
  return page.evaluate(() => (window as any).__capturedEvents || []);
}

/**
 * Get captured events filtered by type
 */
export async function getEventsByType<T extends ToolbarEvent['type']>(
  page: Page,
  type: T
): Promise<Extract<ToolbarEvent, { type: T }>[]> {
  const events = await getEvents(page);
  return events.filter((event): event is Extract<ToolbarEvent, { type: T }> => event.type === type);
}

/**
 * Clear captured events
 */
export async function clearEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__capturedEvents = [];
  });
}

/**
 * Create a mock screenshot item for testing
 */
export function createMockScreenshot(overrides: Partial<ScreenshotItem> = {}): ScreenshotItem {
  const id = Math.random().toString(36).slice(2, 10);
  return {
    id,
    name: `Test Screenshot ${id}`,
    url: TEST_PAGE_URL,
    selector: '#hero',
    createdAt: Date.now(),
    ...overrides,
  };
}
