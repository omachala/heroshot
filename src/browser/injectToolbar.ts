import { readFileSync } from 'node:fs';
import type { Page } from 'playwright';
import { EDITOR_DIR } from './constants';
import { initHeroshot, isHeroshotInitialized, updatePendingJob } from './pageScripts';
import { toolbarEventSchema } from './schema';
import type { InjectToolbarOptions } from './types';

const exposedPages = new WeakSet<Page>();

/**
 * Inject the heroshot toolbar into a page.
 * Handles exposing the event handler and initializing the toolbar state.
 */
export async function injectToolbar(page: Page, options: InjectToolbarOptions): Promise<void> {
  const { screenshots, pendingJob, selectedId, sidebarExpanded, onEvent } = options;

  // Expose single event handler to page (only once per page)
  // All toolbar events go through this single channel
  if (!exposedPages.has(page)) {
    await page.exposeFunction('__heroshotEmit', (eventJson: string) => {
      const event = toolbarEventSchema.parse(JSON.parse(eventJson));
      onEvent(event);
    });
    exposedPages.add(page);
  }

  // Check if toolbar is already initialized - if so, just update the job
  const alreadyInitialized = await page.evaluate(isHeroshotInitialized);

  if (alreadyInitialized) {
    // Toolbar already running - just update the pending job and trigger execution
    await page.evaluate(updatePendingJob, pendingJob);
    return;
  }

  // Initialize __heroshot namespace
  await page.evaluate(initHeroshot, { screenshots, pendingJob, selectedId, sidebarExpanded });

  // Inject editor JS (CSS is bundled via Shadow DOM)
  const scriptPath = `${EDITOR_DIR}/dist/editor.js`;
  const script = readFileSync(scriptPath, 'utf8');
  await page.addScriptTag({ content: script });
}
