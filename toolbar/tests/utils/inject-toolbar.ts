import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from 'playwright/test';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOOLBAR_SCRIPT_PATH = resolve(__dirname, '../../dist/toolbar.js');

/**
 * Inject the toolbar into the page
 */
export async function injectToolbar(page: Page): Promise<void> {
  const script = readFileSync(TOOLBAR_SCRIPT_PATH, 'utf-8');

  await page.evaluate((scriptContent: string) => {
    // Set up the global namespace
    (globalThis as any).__heroshot = {
      initialized: false,
      screenshots: [],
      pendingJob: null,
      emit: () => {},
    };

    // Inject and execute the toolbar script
    const scriptEl = document.createElement('script');
    scriptEl.textContent = scriptContent;
    document.body.appendChild(scriptEl);
  }, script);

  // Wait for toolbar to initialize
  await page.waitForTimeout(300);
}

/**
 * Get click coordinates for toolbar buttons
 * Toolbar is at bottom-5 (20px from bottom), centered horizontally
 * Button layout: [picker 36px] [gap 8px] [sidebar 36px] [gap 8px] [Done ~80px]
 */
export function getToolbarButtonCoords(viewport: { width: number; height: number }) {
  const toolbarY = viewport.height - 45; // Center of toolbar vertically
  return {
    picker: { x: 660, y: toolbarY },
    sidebar: { x: 705, y: toolbarY },
    done: { x: 760, y: toolbarY },
  };
}
