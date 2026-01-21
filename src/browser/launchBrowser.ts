import type { Browser, BrowserContext } from 'playwright';
import { chromium } from 'playwright';
import { BROWSER_CHANNELS, DEFAULT_VIEWPORT } from './constants';
import { noBrowserError } from './noBrowserError';
import type { LaunchOptions } from './types';

/**
 * Launch browser and create context with optional storage state.
 * Tries system Chrome first, falls back to Playwright's bundled Chromium.
 */
export async function launchBrowser(
  options: LaunchOptions = {}
): Promise<{ browser: Browser; context: BrowserContext }> {
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;

  // Try each browser channel in order
  let browser: Browser | null = null;
  for (const channel of BROWSER_CHANNELS) {
    try {
      browser = await chromium.launch({
        headless: options.headless ?? false,
        channel,
      });
      break;
    } catch {
      // This channel failed, try next one
      continue;
    }
  }

  if (!browser) {
    throw noBrowserError();
  }

  // Create context with viewport and optional storage state
  const context = await browser.newContext({
    viewport,
    ...(options.deviceScaleFactor && { deviceScaleFactor: options.deviceScaleFactor }),
    ...(options.storageState && { storageState: options.storageState }),
    ...(options.colorScheme && { colorScheme: options.colorScheme }),
  });

  return { browser, context };
}
