import type { Browser, BrowserContext } from 'playwright';
import { chromium } from 'playwright';
import { verbose } from '../ui';
import { type BrowserChannel, detectSystemBrowsers } from './browserDetect';
import { DEFAULT_VIEWPORT } from './constants';
import { noBrowserError } from './noBrowserError';
import type { LaunchOptions } from './types';

/**
 * Launch browser and create context with optional storage state.
 * Detects system browsers (Chrome, Edge, Chromium) or falls back to Playwright's Chromium.
 */
export async function launchBrowser(
  options: LaunchOptions = {}
): Promise<{ browser: Browser; context: BrowserContext }> {
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;

  // Detect available system browsers
  const systemBrowsers = detectSystemBrowsers();
  const channelsToTry: (BrowserChannel | undefined)[] = [];

  if (systemBrowsers.length > 0) {
    // Use detected system browsers in order of preference
    for (const { channel } of systemBrowsers) {
      channelsToTry.push(channel);
    }
    verbose(`Detected browsers: ${systemBrowsers.map(({ name }) => name).join(', ')}`);
  }

  // Also try Playwright's bundled Chromium as fallback (undefined channel)
  channelsToTry.push(undefined);

  // Try each browser channel in order
  let browser: Browser | null = null;
  for (const channel of channelsToTry) {
    try {
      browser = await chromium.launch({
        headless: options.headless ?? false,
        ...(channel && { channel }),
      });
      if (channel) {
        verbose(`Using ${channel}`);
      } else {
        verbose('Using Playwright Chromium');
      }
      break;
    } catch (error) {
      // This channel failed, try next one
      verbose(
        `Failed to launch ${channel ?? 'playwright-chromium'}: ${error instanceof Error ? error.message : String(error)}`
      );
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
