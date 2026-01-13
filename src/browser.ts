import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  chromium,
} from 'playwright';
import { ensureHeroshotDirectory, getConfigPath, loadConfig, saveConfig } from './configFile';
import { log } from './logger';
import {
  generateSessionKey,
  loadLocalKey,
  loadSession,
  saveLocalKey,
  saveSession,
  sessionExists,
} from './session';
import type { Screenshot, Viewport } from './types';

const TOOLBAR_DIR = path.join(import.meta.dirname, '..', 'toolbar');

const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 };

/**
 * Browser channels to try in order of preference.
 * System Chrome first (no download needed), then Playwright's bundled Chromium.
 */
const BROWSER_CHANNELS: readonly string[] = ['chrome', 'chromium'];

interface LaunchOptions {
  headless?: boolean;
  viewport?: Viewport;
  deviceScaleFactor?: number;
  storageState?: BrowserContextOptions['storageState'];
}

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
    const message = [
      '',
      'Error: No browser found.',
      '',
      'Heroshot needs a browser to capture screenshots. Options:',
      '',
      '  1. Install Chrome (recommended):',
      '     https://www.google.com/chrome/',
      '',
      '  2. Or install Playwright browsers:',
      '     npx playwright install chromium',
      '',
    ].join('\n');
    throw new Error(message);
  }

  // Create context with viewport and optional storage state
  const context = await browser.newContext({
    viewport,
    ...(options.deviceScaleFactor && { deviceScaleFactor: options.deviceScaleFactor }),
    ...(options.storageState && { storageState: options.storageState }),
  });

  return { browser, context };
}

interface ScreenshotData {
  id: string;
  name: string;
  url: string;
  selector: string;
  createdAt: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  scroll?: {
    x: number;
    y: number;
  };
}

// Job types that CLI can send to toolbar
type ToolbarJob =
  | { type: 'highlight'; selector: string; screenshotId?: string }
  | { type: 'navigate-and-highlight'; url: string; selector: string; screenshotId?: string };

// Events that toolbar sends to CLI
type ToolbarEvent =
  | { type: 'screenshot-added'; data: ScreenshotData }
  | { type: 'screenshot-updated'; data: ScreenshotData }
  | { type: 'screenshot-selected'; id: string; url: string; selector: string }
  | { type: 'screenshot-removed'; id: string }
  | { type: 'job-complete' }
  | { type: 'done' };

const exposedPages = new WeakSet<Page>();

interface InjectToolbarOptions {
  screenshots: ScreenshotData[];
  pendingJob: ToolbarJob | null;
  selectedId: string | null;
  sidebarExpanded: boolean;
  onEvent: (event: ToolbarEvent) => void;
}

async function injectToolbar(page: Page, options: InjectToolbarOptions): Promise<void> {
  const { screenshots, pendingJob, selectedId, sidebarExpanded, onEvent } = options;
  // Expose single event handler to page (only once per page)
  // All toolbar events go through this single channel
  if (!exposedPages.has(page)) {
    await page.exposeFunction('__heroshotEmit', (eventJson: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON from trusted toolbar
      const event: ToolbarEvent = JSON.parse(eventJson);
      onEvent(event);
    });
    exposedPages.add(page);
  }

  // Initialize or update __heroshot namespace
  // Using string to avoid tsx transpilation issues (__name helper)
  const screenshotsJson = JSON.stringify(screenshots);
  const pendingJobJson = JSON.stringify(pendingJob);
  const selectedIdJson = JSON.stringify(selectedId);

  // Check if toolbar is already initialized - if so, just update the job
  const alreadyInitialized = await page.evaluate('globalThis.__heroshot?.initialized === true');

  if (alreadyInitialized) {
    // Toolbar already running - just update the pending job and trigger execution
    await page.evaluate(`
      globalThis.__heroshot.pendingJob = ${pendingJobJson};
      // Dispatch custom event to notify toolbar of new job
      window.dispatchEvent(new CustomEvent('heroshot-job', { detail: ${pendingJobJson} }));
    `);
    return;
  }

  await page.evaluate(`
    globalThis.__heroshot = {
      initialized: false,
      screenshots: ${screenshotsJson},
      pendingJob: ${pendingJobJson},
      selectedId: ${selectedIdJson},
      sidebarExpanded: ${sidebarExpanded},
      emit: function(event) {
        globalThis.__heroshotEmit(JSON.stringify(event));
      },
    };
  `);

  // Inject toolbar JS (CSS is bundled via Shadow DOM)
  const scriptPath = path.join(TOOLBAR_DIR, 'dist', 'toolbar.js');
  const script = readFileSync(scriptPath, 'utf8');
  await page.addScriptTag({ content: script });
}

export async function setup(): Promise<{ hasScreenshots: boolean }> {
  log.verbose('Opening browser...');

  // Ensure .heroshot directory exists with README
  ensureHeroshotDirectory();

  const configPath = getConfigPath();
  const config = loadConfig(configPath);
  const viewport = config.browser?.viewport ?? DEFAULT_VIEWPORT;

  // Get or generate session key
  let sessionKey = loadLocalKey();
  const isNewKey = !sessionKey;
  if (!sessionKey) {
    sessionKey = generateSessionKey();
    saveLocalKey(sessionKey);
  }

  // Load existing session if available
  let storageState: BrowserContextOptions['storageState'] | undefined;
  if (sessionExists()) {
    const state = loadSession(sessionKey);
    if (state) {
      // eslint-disable-next-line no-restricted-syntax -- deserialized session data
      storageState = state as BrowserContextOptions['storageState'];
      log.verbose('Loaded existing session.');
    }
  }

  // Convert config screenshots to toolbar format - this is the running list
  // that includes both original config items AND newly added items
  const allScreenshots: ScreenshotData[] = config.screenshots.map((screenshot, index) => ({
    id: screenshot.id,
    name: screenshot.name,
    url: screenshot.url,
    selector: screenshot.selector ?? '',
    // Use index as fallback createdAt for existing items (older items first)
    createdAt: index,
    ...(screenshot.padding && { padding: screenshot.padding }),
    ...(screenshot.scroll && { scroll: screenshot.scroll }),
  }));

  // Track only NEW items added this session (for saving to config at the end)
  const newlyAddedIds = new Set<string>();
  let pendingJob: ToolbarJob | null = null;
  // Track selected screenshot and sidebar state for cross-URL navigation
  let selectedId: string | null = null;
  let sidebarExpanded = false;

  const { browser, context } = await launchBrowser({ headless: false, viewport, storageState });

  // Handle events from toolbar
  const handleEvent = (event: ToolbarEvent) => {
    switch (event.type) {
      case 'screenshot-added': {
        allScreenshots.push(event.data);
        newlyAddedIds.add(event.data.id);
        log.verbose(`Added: ${event.data.name}`);
        break;
      }

      case 'screenshot-updated': {
        const index = allScreenshots.findIndex(item => item.id === event.data.id);
        if (index !== -1) {
          allScreenshots[index] = event.data;
          // Mark as newly added so it gets saved
          newlyAddedIds.add(event.data.id);
          log.verbose(`Renamed: ${event.data.name}`);
        }
        break;
      }

      case 'screenshot-selected': {
        // User selected a screenshot - create job to highlight it
        const [currentPage] = context.pages();
        if (!currentPage) break;

        // Track selected ID and keep sidebar open for cross-URL navigation
        selectedId = event.id;
        sidebarExpanded = true;

        const currentUrl = currentPage.url();

        if (currentUrl === event.url) {
          // Already on the right page - send highlight job via event
          pendingJob = { type: 'highlight', selector: event.selector, screenshotId: event.id };
          void currentPage.evaluate(`
            window.dispatchEvent(new CustomEvent('heroshot-job', {
              detail: { type: 'highlight', selector: ${JSON.stringify(event.selector)}, screenshotId: ${JSON.stringify(event.id)} }
            }));
          `);
        } else {
          // Navigate to the page - toolbar will get job on inject
          pendingJob = {
            type: 'navigate-and-highlight',
            url: event.url,
            selector: event.selector,
            screenshotId: event.id,
          };
          void currentPage.goto(event.url, { waitUntil: 'domcontentloaded' });
        }
        break;
      }

      case 'job-complete': {
        pendingJob = null;
        break;
      }

      case 'done': {
        // Capture storage state before closing (for encrypted session)
        void (async () => {
          try {
            const currentStorageState = await context.storageState();
            saveSession(currentStorageState, sessionKey);
            log.verbose('Session saved.');
          } catch {
            // Ignore errors - session save is best-effort
          }
          await browser.close();
        })();
        break;
      }
    }
  };

  const setupPage = (page: Page) => {
    // Inject on every navigation within the page
    page.on('domcontentloaded', async () => {
      const url = page.url();
      // Skip about:blank and other non-http pages
      if (!url.startsWith('http')) return;

      try {
        await injectToolbar(page, {
          screenshots: allScreenshots,
          pendingJob,
          selectedId,
          sidebarExpanded,
          onEvent: handleEvent,
        });
      } catch {
        // Toolbar injection can fail on some pages, ignore silently
      }
    });
  };

  // Handle new pages/tabs
  context.on('page', page => {
    setupPage(page);
  });

  // Use existing page from context or create one if none exists
  const existingPages = context.pages();
  const page = existingPages[0] ?? (await context.newPage());
  setupPage(page);

  // Navigate to heroshot.sh welcome page
  await page.goto('https://heroshot.sh/welcome', { waitUntil: 'domcontentloaded' });

  log('Pick elements to screenshot. Close browser or click Done when finished.');

  // Wait for browser to close (either via Done button or manual close)
  await new Promise<void>(resolve => {
    browser.once('disconnected', () => resolve());
  });

  // Reload config in case it was modified while browser was open
  const latestConfig = loadConfig(configPath);

  // Save newly added items to config
  for (const element of allScreenshots) {
    if (!newlyAddedIds.has(element.id)) continue;

    // Slugify name for output filename (just filename, no path)
    const filename =
      element.name
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/(?:^-|-$)/g, '') + '.png';

    const screenshot: Screenshot = {
      id: element.id,
      name: element.name,
      url: element.url,
      selector: element.selector,
      filename,
      ...(element.padding && { padding: element.padding }),
      ...(element.scroll && { scroll: element.scroll }),
    };

    // Add or update screenshot
    const existingIndex = latestConfig.screenshots.findIndex(item => item.id === element.id);
    if (existingIndex === -1) {
      latestConfig.screenshots.push(screenshot);
      log.verbose(`+ ${element.name}`);
    } else {
      latestConfig.screenshots[existingIndex] = screenshot;
      log.verbose(`~ ${element.name} (updated)`);
    }
  }

  // Always save config (ensures config file exists)
  saveConfig(configPath, latestConfig);
  log.verbose(`Config saved: ${configPath}`);

  // Display session key info for CI setup
  if (isNewKey) {
    log('');
    log('Session encrypted and saved to .heroshot/session.enc');
    log('');
    log('To print your session key, run: npx heroshot session-key');
    log('');
    log('For CI, add HEROSHOT_SESSION_KEY as a repository secret.');
  }

  // Return whether there are screenshots to sync
  return { hasScreenshots: allScreenshots.length > 0 };
}
