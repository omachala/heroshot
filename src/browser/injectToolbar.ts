/**
 * Toolbar injection into browser pages.
 *
 * ============================================================================
 * IMPORTANT: WHY WE USE MIXED EVALUATION APPROACHES
 * ============================================================================
 *
 * This file uses TWO different approaches for page.evaluate():
 *
 * 1. STRING-BASED evaluation for initHeroshot (initialization)
 * 2. TYPED FUNCTION evaluation for isHeroshotInitialized, updatePendingJob
 *
 * WHY THE DIFFERENCE?
 *
 * When tsx/esbuild transpiles exported functions that contain NESTED FUNCTION
 * PROPERTIES, it wraps them with __name() helper for debugging. This breaks
 * page.evaluate() because __name doesn't exist in browser context.
 *
 * The initHeroshot logic needs to create:
 *   globalThis.__heroshot = {
 *     emit: function(event) { ... }  // ← nested function property!
 *   }
 *
 * This nested function property would get __name() wrapped, causing:
 *   ReferenceError: __name is not defined
 *
 * SOLUTION:
 * - initHeroshot: Use STRING-BASED evaluation (strings aren't transpiled)
 * - Other functions: Use TYPED evaluation (they have no nested function props)
 *
 * See pageScripts.ts header comment for full technical explanation.
 * ============================================================================
 */

import { readFileSync } from 'node:fs';
import type { Page } from 'playwright';
import { EDITOR_DIR } from './constants';
// These functions are SAFE for page.evaluate() - they have no nested function
// properties, so esbuild doesn't add __name wrappers. See pageScripts.ts.
import { isHeroshotInitialized, updatePendingJob } from './pageScripts';
import { toolbarEventSchema } from './schema';
import type { InjectToolbarOptions } from './types';

const exposedPages = new WeakSet<Page>();
const injectingPages = new WeakSet<Page>();

/**
 * Inject the heroshot toolbar into a page.
 * Handles exposing the event handler and initializing the toolbar state.
 *
 * Uses a mutex (injectingPages) to prevent concurrent injections on the same
 * page, which could cause multiple toolbars to appear.
 */
export async function injectToolbar(page: Page, options: InjectToolbarOptions): Promise<void> {
  // Mutex: prevent concurrent injections on the same page.
  // Without this, rapid navigation or multiple event listeners could trigger
  // simultaneous injections before any completes, resulting in multiple toolbars.
  if (injectingPages.has(page)) {
    return;
  }
  injectingPages.add(page);

  try {
    await doInjectToolbar(page, options);
  } finally {
    injectingPages.delete(page);
  }
}

async function doInjectToolbar(page: Page, options: InjectToolbarOptions): Promise<void> {
  const { screenshots, pendingJob, selectedId, sidebarExpanded, onEvent } = options;

  // Expose event handler to page (only once per page lifetime).
  // All toolbar events flow through this single channel.
  if (!exposedPages.has(page)) {
    await page.exposeFunction('__heroshotEmit', (eventJson: string) => {
      const event = toolbarEventSchema.parse(JSON.parse(eventJson));
      onEvent(event);
    });
    exposedPages.add(page);
  }

  // Check if toolbar is already initialized.
  // SAFE to use typed function - isHeroshotInitialized has no nested function props.
  const alreadyInitialized = await page.evaluate(isHeroshotInitialized);

  if (alreadyInitialized) {
    // Toolbar already running - just update the pending job.
    // SAFE to use typed function - updatePendingJob has no nested function props.
    await page.evaluate(updatePendingJob, pendingJob);
    return;
  }

  // ============================================================================
  // INITIALIZATION: Must use STRING-BASED evaluation
  // ============================================================================
  // We cannot use a typed function here because we need to create:
  //   globalThis.__heroshot = { emit: function(event) { ... } }
  //
  // The `emit` property is a nested function, which would get wrapped with
  // esbuild's __name() helper, breaking page.evaluate(). String evaluation
  // bypasses esbuild transpilation entirely.
  //
  // We also inject the editor script in the same evaluate call to ensure
  // atomic initialization - no race condition between setting up __heroshot
  // and the script trying to read it.
  // ============================================================================

  const scriptPath = `${EDITOR_DIR}/dist/editor.js`;
  const scriptContent = readFileSync(scriptPath, 'utf8');

  await page.evaluate(
    `(function(screenshots, pendingJob, selectedId, sidebarExpanded, scriptContent) {
      // Initialize __heroshot global namespace
      globalThis.__heroshot = {
        initialized: false,
        screenshots: screenshots,
        pendingJob: pendingJob,
        selectedId: selectedId,
        sidebarExpanded: sidebarExpanded,
        // This emit function is why we use string evaluation.
        // As a nested function property, it would get __name() wrapped
        // if we used a typed function approach.
        emit: function(event) {
          globalThis.__heroshotEmit(JSON.stringify(event));
        },
      };

      // Inject and execute the editor script immediately after setup.
      // Using script element injection ensures proper execution context.
      var script = document.createElement('script');
      script.textContent = scriptContent;
      document.body.appendChild(script);
    })(${JSON.stringify(screenshots)}, ${JSON.stringify(pendingJob)}, ${JSON.stringify(selectedId)}, ${JSON.stringify(sidebarExpanded)}, ${JSON.stringify(scriptContent)})`
  );
}
