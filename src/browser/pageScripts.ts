/**
 * Scripts to be executed in browser page context via page.evaluate().
 * These are pure functions that get serialized and run in the browser.
 */

import type { ScreenshotData, ToolbarJob } from './types';

/** Heroshot global namespace injected into pages */
type HeroshotGlobal = {
  initialized: boolean;
  screenshots: ScreenshotData[];
  pendingJob: ToolbarJob | null;
  selectedId: string | null;
  sidebarExpanded: boolean;
  emit: (event: unknown) => void;
};

/**
 * Browser global context with heroshot extensions.
 * Used for type-safe access to browser globals in page.evaluate scripts.
 */
type BrowserGlobal = {
  __heroshot?: HeroshotGlobal;
  __heroshotEmit: (eventJson: string) => void;
  dispatchEvent: (event: Event) => boolean;
};

/**
 * Type-safe accessor for browser globals.
 * This cast is necessary because these functions run in browser context
 * where globalThis has different properties than in Node.js.
 */
// eslint-disable-next-line no-restricted-syntax -- required for browser/Node bridge
const browser = globalThis as unknown as BrowserGlobal;

/** Options for initializing heroshot global */
type InitHeroshotOptions = {
  screenshots: ScreenshotData[];
  pendingJob: ToolbarJob | null;
  selectedId: string | null;
  sidebarExpanded: boolean;
};

/**
 * Initialize the __heroshot global namespace in the page.
 * Must be called before injecting the editor script.
 */
export function initHeroshot(options: InitHeroshotOptions): void {
  browser.__heroshot = {
    initialized: false,
    screenshots: options.screenshots,
    pendingJob: options.pendingJob,
    selectedId: options.selectedId,
    sidebarExpanded: options.sidebarExpanded,
    emit: (event: unknown) => {
      browser.__heroshotEmit(JSON.stringify(event));
    },
  };
}

/**
 * Check if heroshot toolbar is already initialized on the page.
 */
export function isHeroshotInitialized(): boolean {
  return browser.__heroshot?.initialized === true;
}

/**
 * Update the pending job and dispatch event to notify toolbar.
 */
export function updatePendingJob(pendingJob: ToolbarJob | null): void {
  if (browser.__heroshot) {
    browser.__heroshot.pendingJob = pendingJob;
  }
  browser.dispatchEvent(new CustomEvent('heroshot-job', { detail: pendingJob }));
}

/** Options for dispatching highlight job */
type DispatchHighlightOptions = {
  selector: string;
  screenshotId: string;
};

/**
 * Dispatch a highlight job event to the toolbar.
 */
export function dispatchHighlightJob(options: DispatchHighlightOptions): void {
  browser.dispatchEvent(
    new CustomEvent('heroshot-job', {
      detail: {
        type: 'highlight',
        selector: options.selector,
        screenshotId: options.screenshotId,
      },
    })
  );
}
