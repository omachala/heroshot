/**
 * Scripts to be executed in browser page context via page.evaluate().
 *
 * ============================================================================
 * CRITICAL: esbuild __name HELPER ISSUE - READ THIS BEFORE MODIFYING
 * ============================================================================
 *
 * BACKGROUND:
 * When we run the CLI with `tsx` (which uses esbuild under the hood), esbuild
 * adds a __name() helper function to preserve function names for debugging.
 *
 * THE PROBLEM:
 * When Playwright's page.evaluate(fn, args) is called, it serializes the
 * function using Function.prototype.toString(). If esbuild has modified the
 * function to include __name() calls, the serialized code will reference
 * __name - but __name doesn't exist in the browser context!
 *
 * This causes: ReferenceError: __name is not defined
 *
 * WHEN DOES esbuild ADD __name?
 * esbuild adds __name() wrapper specifically when:
 *   1. A function is EXPORTED from a module, AND
 *   2. That function contains a NESTED FUNCTION ASSIGNED TO A PROPERTY
 *
 * Examples:
 *
 *   // BROKEN - nested function property gets __name wrapper
 *   export function init() {
 *     return {
 *       callback: function(x) { ... }  // ← __name wraps this!
 *     };
 *   }
 *   // Serializes to: { callback: __name(function(x) { ... }, "callback") }
 *
 *   // SAFE - no nested function properties
 *   export function getValue() {
 *     return globalThis.someValue;
 *   }
 *   // Serializes cleanly without __name
 *
 * WHY THIS FILE EXISTS:
 * This file contains ONLY functions that are SAFE to use with page.evaluate().
 * These functions have NO nested function properties, so esbuild doesn't add
 * __name wrappers and they serialize correctly for browser execution.
 *
 * WHAT ABOUT initHeroshot?
 * The initHeroshot function needs to create __heroshot.emit = function() {...}
 * which is a nested function property. Therefore it CANNOT be defined here.
 * It must use STRING-BASED evaluation in injectToolbar.ts instead.
 *
 * See injectToolbar.ts for how initialization is handled safely.
 * ============================================================================
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

// NOTE: Module-level variables are NOT available when functions are serialized
// for page.evaluate(). Each function must access globalThis directly.

/**
 * Check if heroshot toolbar is already initialized on the page.
 *
 * SAFE for page.evaluate() - no nested function properties.
 */
export function isHeroshotInitialized(): boolean {
  // eslint-disable-next-line no-restricted-syntax -- browser context requires globalThis cast
  return (globalThis as unknown as BrowserGlobal).__heroshot?.initialized === true;
}

/**
 * Update the pending job and dispatch event to notify toolbar.
 *
 * SAFE for page.evaluate() - no nested function properties.
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
 *
 * SAFE for page.evaluate() - no nested function properties.
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
