import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';
import {
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  chromium,
} from 'playwright';
import { type BrowserChannel, detectSystemBrowsers } from './browserDetect';
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
import { info, log, note, spinner, success, verbose } from './ui';

const TOOLBAR_DIR = path.join(import.meta.dirname, '..', 'toolbar');

const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 };

interface LaunchOptions {
  headless?: boolean;
  viewport?: Viewport;
  deviceScaleFactor?: number;
  storageState?: BrowserContextOptions['storageState'];
  colorScheme?: 'light' | 'dark';
}

/**
 * Prompt user for yes/no confirmation
 */
async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(`${message} (y/N) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Install Playwright's Chromium browser
 */
function installPlaywrightChromium(): boolean {
  log('Installing Chromium browser...');
  log('');

  try {
    // Use npx to install - works in both Node and Bun environments
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- npx is required for playwright install
    execSync('npx playwright install chromium', {
      stdio: 'inherit',
    });
    log('');
    log('Chromium installed successfully.');
    return true;
  } catch {
    log('');
    log('Failed to install Chromium.');
    return false;
  }
}

/**
 * Check if npx is available (Node.js installed)
 */
function isNpxAvailable(): boolean {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- checking if npx exists
    execSync('which npx', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompt user to install browser when none found
 */
async function promptBrowserInstall(headless: boolean): Promise<Browser | null> {
  log('');
  log('No browser found.');
  log('');
  log('Heroshot needs a Chromium-based browser to capture screenshots.');
  log('');

  if (isNpxAvailable()) {
    log('Options:');
    log('  1. Install Chromium now (recommended, ~150MB download)');
    log('  2. Install Chrome manually: https://www.google.com/chrome/');
    log('');

    const shouldInstall = await confirm('Install Chromium now?');

    if (shouldInstall && installPlaywrightChromium()) {
      // Try launching again with Playwright Chromium
      return chromium.launch({ headless });
    }
  } else {
    // No npx - standalone binary without Node
    log('Please install a browser:');
    log('');
    log('  Chrome: https://www.google.com/chrome/');
    log('  Edge:   https://www.microsoft.com/edge');
    log('');
  }

  return null;
}

/**
 * Launch browser and create context with optional storage state.
 * Detects system browsers (Chrome, Edge, Chromium) or prompts to install Chromium.
 */
export async function launchBrowser(
  options: LaunchOptions = {}
): Promise<{ browser: Browser; context: BrowserContext }> {
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;
  verbose(`Launching browser (headless: ${options.headless ?? false})...`);

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

  // If no browser found, prompt to install Chromium
  if (!browser) {
    browser = await promptBrowserInstall(options.headless ?? false);
    if (!browser) {
      throw new Error('No browser available. Please install Chrome or Edge and try again.');
    }
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
  maskPadding?: boolean;
}

// Job types that CLI can send to toolbar
type ToolbarJob =
  | { type: 'highlight'; selector: string; screenshotId?: string }
  | { type: 'navigate-and-highlight'; url: string; selector: string; screenshotId?: string };

// Browser settings from toolbar
// colorScheme: 'auto' = browser default, 'light'/'dark' = explicit, undefined = both
interface BrowserSettings {
  viewport: { width: number; height: number };
  colorScheme?: 'auto' | 'light' | 'dark';
  deviceScaleFactor?: number;
}

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

export interface SetupOptions {
  /** Force browser color scheme (light/dark) for testing */
  colorScheme?: 'light' | 'dark';
}

// eslint-disable-next-line complexity -- main entry point, complexity is acceptable
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
    ...(screenshot.maskPadding && { maskPadding: screenshot.maskPadding }),
  }));

  // Track only NEW items added this session (for saving to config at the end)
  const newlyAddedIds = new Set<string>();
  // Track deleted items this session
  const deletedIds = new Set<string>();
  let pendingJob: ToolbarJob | null = null;
  // Track selected screenshot and sidebar state for cross-URL navigation
  let selectedId: string | null = null;
  let sidebarExpanded = false;
  // Track updated browser settings
  let updatedBrowserSettings: BrowserSettings | null = null;

  const { browser, context } = await launchBrowser({
    headless: false,
    viewport,
    storageState,
    colorScheme: options.colorScheme,
  });

  setupSpinner.stop('Browser ready');
  info('Pick elements to screenshot. Close browser or click Done when finished.');

  // Handle events from toolbar
  const handleEvent = (event: ToolbarEvent) => {
    switch (event.type) {
      case 'screenshot-added': {
        allScreenshots.push(event.data);
        newlyAddedIds.add(event.data.id);
        verbose(`Added: ${event.data.name}`);
        break;
      }

      case 'screenshot-updated': {
        const index = allScreenshots.findIndex(item => item.id === event.data.id);
        if (index !== -1) {
          allScreenshots[index] = event.data;
          // Mark as newly added so it gets saved
          newlyAddedIds.add(event.data.id);
          verbose(`Updated: ${event.data.name}`);
        }
        break;
      }

      case 'screenshot-removed': {
        const index = allScreenshots.findIndex(item => item.id === event.id);
        if (index !== -1) {
          const [removed] = allScreenshots.splice(index, 1);
          deletedIds.add(event.id);
          // If it was newly added this session, no need to track deletion
          newlyAddedIds.delete(event.id);
          verbose(`Removed: ${removed?.name ?? event.id}`);
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
      ...(element.maskPadding && { maskPadding: element.maskPadding }),
    };

    // Add or update screenshot
    const existingIndex = latestConfig.screenshots.findIndex(item => item.id === element.id);
    if (existingIndex === -1) {
      latestConfig.screenshots.push(screenshot);
      verbose(`+ ${element.name}`);
    } else {
      latestConfig.screenshots[existingIndex] = screenshot;
      verbose(`~ ${element.name} (updated)`);
    }
  }

  // Remove deleted items from config
  for (const id of deletedIds) {
    const index = latestConfig.screenshots.findIndex(item => item.id === id);
    if (index !== -1) {
      const [removed] = latestConfig.screenshots.splice(index, 1);
      verbose(`- ${removed?.name ?? id} (deleted)`);
    }
  }

  // Update browser settings if changed
  // eslint-disable-next-line no-restricted-syntax -- callback assignment breaks TS narrowing
  const finalSettings = updatedBrowserSettings as BrowserSettings | null;
  if (finalSettings) {
    latestConfig.browser = {
      ...latestConfig.browser,
      viewport: finalSettings.viewport,
      ...(finalSettings.colorScheme && { colorScheme: finalSettings.colorScheme }),
      ...(finalSettings.deviceScaleFactor && {
        deviceScaleFactor: finalSettings.deviceScaleFactor,
      }),
    };
    verbose('Browser settings saved');
  }

  // Always save config (ensures config file exists)
  saveConfig(configPath, latestConfig);
  verbose(`Config saved: ${configPath}`);

  // Display session key info for CI setup
  if (isNewKey) {
    note(
      'To print your session key:\n  npx heroshot session-key\n\nFor CI, add HEROSHOT_SESSION_KEY as a repository secret.',
      'Session encrypted'
    );
  }

  // Show config saved message
  if (newlyAddedIds.size > 0 || deletedIds.size > 0 || finalSettings) {
    const { size: addedCount } = newlyAddedIds;
    const { size: deletedCount } = deletedIds;
    const parts: string[] = [];
    if (addedCount > 0) parts.push(`${addedCount} added`);
    if (deletedCount > 0) parts.push(`${deletedCount} removed`);
    if (finalSettings) parts.push('settings updated');
    success(`Config updated: ${parts.join(', ')}`);
  }

  // Return whether there are screenshots to sync
  return { hasScreenshots: allScreenshots.length > 0 };
}
