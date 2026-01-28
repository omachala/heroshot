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

// NOTE: Module-level variables are NOT available when functions are serialized for page.evaluate().
// Each function must access globalThis directly with inline type assertions.

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
  // eslint-disable-next-line no-restricted-syntax -- browser context requires globalThis cast
  const g = globalThis as unknown as BrowserGlobal;
  g.__heroshot = {
    initialized: false,
    screenshots: options.screenshots,
    pendingJob: options.pendingJob,
    selectedId: options.selectedId,
    sidebarExpanded: options.sidebarExpanded,
    emit: (event: unknown) => {
      // eslint-disable-next-line no-restricted-syntax -- browser context requires globalThis cast
      (globalThis as unknown as BrowserGlobal).__heroshotEmit(JSON.stringify(event));
    },
  };
}

/**
 * Check if heroshot toolbar is already initialized on the page.
 */
export function isHeroshotInitialized(): boolean {
  // eslint-disable-next-line no-restricted-syntax -- browser context requires globalThis cast
  return (globalThis as unknown as BrowserGlobal).__heroshot?.initialized === true;
}

/**
 * Update the pending job and dispatch event to notify toolbar.
 */
export function updatePendingJob(pendingJob: ToolbarJob | null): void {
  // eslint-disable-next-line no-restricted-syntax -- browser context requires globalThis cast
  const g = globalThis as unknown as BrowserGlobal;
  if (g.__heroshot) {
    g.__heroshot.pendingJob = pendingJob;
  }
  g.dispatchEvent(new CustomEvent('heroshot-job', { detail: pendingJob }));
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
  // eslint-disable-next-line no-restricted-syntax -- browser context requires globalThis cast
  (globalThis as unknown as BrowserGlobal).dispatchEvent(
    new CustomEvent('heroshot-job', {
      detail: {
        type: 'highlight',
        selector: options.selector,
        screenshotId: options.screenshotId,
      },
    })
  );
}
