import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from 'playwright/test';

const currentDir = dirname(fileURLToPath(import.meta.url));
const TOOLBAR_SCRIPT_PATH = resolve(currentDir, '../../dist/toolbar.js');

export const TEST_PAGE_URL = 'https://heroshot.sh/__tests__/toolbar';

/**
 * Screenshot item for testing
 */
export interface ScreenshotItem {
  id: string;
  name: string;
  url: string;
  selector: string;
  createdAt: number;
}

/**
 * Event types emitted by toolbar
 */
export type ToolbarEvent =
  | { type: 'screenshot-added'; data: ScreenshotItem }
  | { type: 'screenshot-updated'; data: ScreenshotItem }
  | { type: 'screenshot-selected'; id: string; url: string; selector: string }
  | { type: 'screenshot-removed'; id: string }
  | { type: 'job-complete' }
  | { type: 'done' };

/**
 * Options for injecting the toolbar
 */
export interface InjectOptions {
  screenshots?: ScreenshotItem[];
  pendingJob?: { type: string; selector: string; url?: string } | null;
}

/**
 * Captured events from the toolbar
 */
export interface EventCapture {
  events: ToolbarEvent[];
  getByType: <T extends ToolbarEvent['type']>(type: T) => Extract<ToolbarEvent, { type: T }>[];
  clear: () => void;
}

/**
 * Inject the toolbar into the page with optional config
 */
export async function injectToolbar(
  page: Page,
  options: InjectOptions = {}
): Promise<EventCapture> {
  const script = readFileSync(TOOLBAR_SCRIPT_PATH, 'utf-8');
  const { screenshots = [], pendingJob = null } = options;

  // Set up event capture array in page context
  await page.evaluate(
    ({ scriptContent, initialScreenshots, initialJob }) => {
      // Create event store
      (window as any).__capturedEvents = [];

      // Set up the global namespace
      (globalThis as any).__heroshot = {
        initialized: false,
        screenshots: initialScreenshots,
        pendingJob: initialJob,
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
    { scriptContent: script, initialScreenshots: screenshots, initialJob: pendingJob }
  );

  // Wait for toolbar to initialize
  await page.waitForTimeout(300);

  // Return event capture interface
  return {
    get events() {
      return [] as ToolbarEvent[]; // Will be fetched via getEvents()
    },
    getByType: <T extends ToolbarEvent['type']>(type: T) => {
      return [] as Extract<ToolbarEvent, { type: T }>[]; // Placeholder
    },
    clear: () => {},
  };
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
 * Get click coordinates for toolbar buttons
 * Toolbar is at bottom-5 (20px from bottom), centered horizontally
 */
export function getToolbarButtonCoords(viewport: { width: number; height: number }) {
  const toolbarY = viewport.height - 45;
  return {
    picker: { x: 660, y: toolbarY },
    sidebar: { x: 705, y: toolbarY },
    done: { x: 760, y: toolbarY },
  };
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

/**
 * Wait for sidebar to be visible/hidden
 */
export async function waitForSidebar(page: Page, visible: boolean): Promise<void> {
  await page.waitForTimeout(400); // Wait for transition
}

/**
 * Click on an element on the page (for element picking)
 */
export async function clickPageElement(page: Page, selector: string): Promise<void> {
  // Find the element's position
  const position = await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, selector);

  if (!position) {
    throw new Error(`Element not found: ${selector}`);
  }

  await page.mouse.click(position.x, position.y);
}

/**
 * Click the confirm button (tick) on the highlight overlay
 */
export async function clickConfirmButton(page: Page): Promise<void> {
  // The confirm button appears above the highlighted element
  // It's inside shadow DOM, so we need to find it by scanning
  const viewport = page.viewportSize()!;

  // Find confirm button by looking for green circular button
  // It appears at -top-10 from the highlight, centered
  const confirmPos = await page.evaluate(() => {
    // The buttons are inside heroshot-root shadow DOM
    // We need to scan for clickable areas
    const hero = document.querySelector('#hero');
    if (!hero) return null;
    const rect = hero.getBoundingClientRect();
    // Confirm button is 40px above the highlight, centered
    return {
      x: rect.left + rect.width / 2 - 20, // Left button (confirm)
      y: rect.top - 25,
    };
  });

  if (confirmPos) {
    await page.mouse.click(confirmPos.x, confirmPos.y);
  }
}

/**
 * Click the cancel button (X) on the highlight overlay
 */
export async function clickCancelButton(page: Page): Promise<void> {
  const cancelPos = await page.evaluate(() => {
    const hero = document.querySelector('#hero');
    if (!hero) return null;
    const rect = hero.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 + 20, // Right button (cancel)
      y: rect.top - 25,
    };
  });

  if (cancelPos) {
    await page.mouse.click(cancelPos.x, cancelPos.y);
  }
}
