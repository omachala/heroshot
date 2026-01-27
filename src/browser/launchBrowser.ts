import type { Browser, BrowserContext } from 'playwright';
import { chromium } from 'playwright';
import { verbose } from '../ui';
import { type BrowserChannel, detectSystemBrowsers } from './browserDetect';
import { DEFAULT_VIEWPORT } from './constants';
import { noBrowserError } from './noBrowserError';
import type { LaunchOptions } from './types';

/**
 * Get list of browser channels to try, with system browsers first
 */
function getBrowserChannels(): (BrowserChannel | undefined)[] {
  const systemBrowsers = detectSystemBrowsers();
  const channels: (BrowserChannel | undefined)[] = systemBrowsers.map(({ channel }) => channel);

  if (systemBrowsers.length > 0) {
    verbose(`Detected browsers: ${systemBrowsers.map(({ name }) => name).join(', ')}`);
  }

  // Add Playwright's bundled Chromium as fallback
  channels.push(undefined);
  return channels;
}

/**
 * Try to launch browser with given channel
 */
async function tryLaunchBrowser(
  channel: BrowserChannel | undefined,
  headless: boolean
): Promise<Browser | null> {
  try {
    const browser = await chromium.launch({
      headless,
      ...(channel && { channel }),
    });
    verbose(channel ? `Using ${channel}` : 'Using Playwright Chromium');
    return browser;
  } catch (error) {
    verbose(
      `Failed to launch ${channel ?? 'playwright-chromium'}: ${error instanceof Error ? error.message : String(error)}`
    );
    return null;
  }
}

/**
 * Launch browser and create context with optional storage state.
 * Detects system browsers (Chrome, Edge, Chromium) or falls back to Playwright's Chromium.
 */
export async function launchBrowser(
  options: LaunchOptions = {}
): Promise<{ browser: Browser; context: BrowserContext }> {
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;
  const channels = getBrowserChannels();

  // Try each browser channel in order
  let browser: Browser | null = null;
  for (const channel of channels) {
    browser = await tryLaunchBrowser(channel, options.headless ?? false);
    if (browser) break;
  }

  if (!browser) {
    throw noBrowserError();
  }

  // Create context with viewport and optional storage state
  // bypassCSP defaults to true to ensure page.evaluate() works reliably
  const context = await browser.newContext({
    viewport,
    bypassCSP: options.bypassCSP ?? true,
    ...(options.deviceScaleFactor && { deviceScaleFactor: options.deviceScaleFactor }),
    ...(options.storageState && { storageState: options.storageState }),
    ...(options.colorScheme && { colorScheme: options.colorScheme }),
    ...(options.reducedMotion && { reducedMotion: options.reducedMotion }),
    ...(options.userAgent && { userAgent: options.userAgent }),
  });

  return { browser, context };
}
