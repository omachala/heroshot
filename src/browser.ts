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
import {
  generateSessionKey,
  loadLocalKey,
  loadSession,
  saveLocalKey,
  saveSession,
  sessionExists,
} from './session';
import type { Screenshot, Viewport } from './types';
import { note, spinner, verbose } from './ui';

const EDITOR_DIR = path.join(import.meta.dirname, '..', 'editor');

const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 };

/**
 * Browser channels to try in order of preference.
 * System Chrome first (no download needed), then Playwright's bundled Chromium.
 */
const BROWSER_CHANNELS: readonly string[] = ['chrome', 'chromium'];

type LaunchOptions = {
  headless?: boolean;
  viewport?: Viewport;
  deviceScaleFactor?: number;
  storageState?: BrowserContextOptions['storageState'];
  colorScheme?: 'light' | 'dark';
};

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
    ...(options.colorScheme && { colorScheme: options.colorScheme }),
  });

  return { browser, context };
}

type ScreenshotData = {
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
  paddingFill?: 'inherit' | 'solid' | 'transparent';
  elementFill?: 'original' | 'solid' | 'transparent';
  textOverrides?: Record<string, string>;
};

// Job types that CLI can send to toolbar
type ToolbarJob =
  | { type: 'highlight'; selector: string; screenshotId?: string }
  | { type: 'navigate-and-highlight'; url: string; selector: string; screenshotId?: string };

// Browser settings from toolbar
// colorScheme: 'light'/'dark' = explicit, undefined = both
type BrowserSettings = {
  viewport: { width: number; height: number };
  colorScheme?: 'light' | 'dark';
  deviceScaleFactor?: number;
};

// Events that toolbar sends to CLI
type ToolbarEvent =
  | { type: 'screenshot-added'; data: ScreenshotData }
  | { type: 'screenshot-updated'; data: ScreenshotData }
  | { type: 'screenshot-selected'; id: string; url: string; selector: string }
  | { type: 'screenshot-removed'; id: string }
  | { type: 'settings-updated'; data: BrowserSettings }
  | { type: 'job-complete' }
  | { type: 'done' };

const exposedPages = new WeakSet<Page>();

/**
 * Convert ScreenshotData to Screenshot for config
 * Filename is derived from name at sync time - not stored in config
 */
function toConfigScreenshot(data: ScreenshotData): Screenshot {
  return {
    id: data.id,
    name: data.name,
    url: data.url,
    selector: data.selector,
    ...(data.padding && { padding: data.padding }),
    ...(data.scroll && { scroll: data.scroll }),
    ...(data.paddingFill && { paddingFill: data.paddingFill }),
    ...(data.elementFill && { elementFill: data.elementFill }),
    ...(data.textOverrides &&
      Object.keys(data.textOverrides).length > 0 && { textOverrides: data.textOverrides }),
  };
}

/**
 * Save current state to config file
 */
function saveCurrentConfig(
  configPath: string,
  allScreenshots: ScreenshotData[],
  browserSettings: BrowserSettings | null
): void {
  const config = loadConfig(configPath);

  // Rebuild screenshots array from current state
  config.screenshots = allScreenshots.map(toConfigScreenshot);

  // Update browser settings if changed
  if (browserSettings) {
    config.browser = {
      ...config.browser,
      viewport: browserSettings.viewport,
      ...(browserSettings.colorScheme && { colorScheme: browserSettings.colorScheme }),
      ...(browserSettings.deviceScaleFactor && {
        deviceScaleFactor: browserSettings.deviceScaleFactor,
      }),
    };
  }

  saveConfig(configPath, config);
  verbose('Config saved');
}

type InjectToolbarOptions = {
  screenshots: ScreenshotData[];
  pendingJob: ToolbarJob | null;
  selectedId: string | null;
  sidebarExpanded: boolean;
  onEvent: (event: ToolbarEvent) => void;
};

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

  // Inject editor JS (CSS is bundled via Shadow DOM)
  const scriptPath = path.join(EDITOR_DIR, 'dist', 'editor.js');
  const script = readFileSync(scriptPath, 'utf8');
  await page.addScriptTag({ content: script });
}

export type SetupOptions = {
  /** Force browser color scheme (light/dark) for testing */
  colorScheme?: 'light' | 'dark';
};

export async function setup(options: SetupOptions = {}): Promise<{ hasScreenshots: boolean }> {
  const setupSpinner = spinner();
  setupSpinner.start('Launching browser...');

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
      verbose('Loaded existing session');
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
    ...(screenshot.paddingFill && { paddingFill: screenshot.paddingFill }),
    ...(screenshot.elementFill && { elementFill: screenshot.elementFill }),
    ...(screenshot.textOverrides && { textOverrides: screenshot.textOverrides }),
  }));

  let pendingJob: ToolbarJob | null = null;
  // Track selected screenshot and sidebar state for cross-URL navigation
  let selectedId: string | null = null;
  let sidebarExpanded = false;
  // Track updated browser settings
  let updatedBrowserSettings: BrowserSettings | null = null;

  // Helper to save config after changes
  const save = () => {
    saveCurrentConfig(configPath, allScreenshots, updatedBrowserSettings);
  };

  const { browser, context } = await launchBrowser({
    headless: false,
    viewport,
    storageState,
    colorScheme: options.colorScheme,
  });

  setupSpinner.stop('Browser ready');

  // Handle events from toolbar
  const handleEvent = (event: ToolbarEvent) => {
    switch (event.type) {
      case 'screenshot-added': {
        allScreenshots.push(event.data);
        verbose(`Added: ${event.data.name}`);
        save();
        break;
      }

      case 'screenshot-updated': {
        const index = allScreenshots.findIndex(({ id }) => id === event.data.id);
        if (index !== -1) {
          allScreenshots[index] = event.data;
          verbose(`Updated: ${event.data.name}`);
          save();
        }
        break;
      }

      case 'screenshot-removed': {
        const index = allScreenshots.findIndex(({ id }) => id === event.id);
        if (index !== -1) {
          const [removed] = allScreenshots.splice(index, 1);
          verbose(`Removed: ${removed?.name ?? event.id}`);
          save();
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

      case 'settings-updated': {
        updatedBrowserSettings = event.data;
        verbose(`Settings updated: ${JSON.stringify(event.data)}`);
        save();
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
            verbose('Session saved');
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

  // Close browser when user manually closes the last window
  // (browser.disconnected only fires when process terminates, not when windows close)
  const handlePageClose = (page: Page) => {
    page.on('close', () => {
      if (context.pages().length === 0) {
        void browser.close();
      }
    });
  };

  // Handle new pages/tabs
  context.on('page', page => {
    setupPage(page);
    handlePageClose(page);
  });

  // Use existing page from context or create one if none exists
  const existingPages = context.pages();
  const page = existingPages[0] ?? (await context.newPage());
  setupPage(page);
  handlePageClose(page);

  // Navigate to heroshot.sh welcome page
  await page.goto('https://heroshot.sh/welcome', { waitUntil: 'domcontentloaded' });

  // Wait for browser to close (either via Close button or manual close)
  await new Promise<void>(resolve => {
    browser.once('disconnected', () => resolve());
  });

  // Display session key info for CI setup
  if (isNewKey) {
    note(
      'To print your session key:\n  npx heroshot session-key\n\nFor CI, add HEROSHOT_SESSION_KEY as a repository secret.',
      'Session encrypted'
    );
  }

  // Return whether there are screenshots to sync
  return { hasScreenshots: allScreenshots.length > 0 };
}
