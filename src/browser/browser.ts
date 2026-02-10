import type { BrowserContextOptions, Page } from 'playwright';
import { ensureHeroshotDirectory, getConfigPath, loadConfig } from '../configFile';
import {
  generateSessionKey,
  loadLocalKey,
  loadSession,
  saveLocalKey,
  saveSession,
  sessionExists,
} from '../session';
import { note, spinner, verbose } from '../ui';
import { configToScreenshotData } from './configToScreenshotData';
import { DEFAULT_VIEWPORT } from './constants';
import { injectToolbar } from './injectToolbar';
import { launchBrowser } from './launchBrowser';
import { dispatchHighlightJob } from './pageScripts';
import { saveCurrentConfig } from './saveCurrentConfig';
import type {
  BrowserSettings,
  ScreenshotData,
  SetupOptions,
  ToolbarEvent,
  ToolbarJob,
} from './types';

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
  const allScreenshots: ScreenshotData[] = configToScreenshotData(config.screenshots);

  let pendingJob: ToolbarJob | null = null;
  let selectedId: string | null = null;
  let sidebarExpanded = false;
  let updatedBrowserSettings: BrowserSettings | null = null;
  let hiddenElements = config.hiddenElements ?? {};

  const save = () =>
    saveCurrentConfig(configPath, allScreenshots, updatedBrowserSettings, hiddenElements);

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
        const [currentPage] = context.pages();
        if (!currentPage) break;
        selectedId = event.id;
        sidebarExpanded = true;
        if (currentPage.url() === event.url) {
          pendingJob = { type: 'highlight', selector: event.selector, screenshotId: event.id };
          currentPage
            .evaluate(dispatchHighlightJob, { selector: event.selector, screenshotId: event.id })
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- fire and forget
            .catch(() => {});
        } else {
          pendingJob = { type: 'navigate-and-highlight', url: event.url, selector: event.selector, screenshotId: event.id };
          // eslint-disable-next-line @typescript-eslint/no-empty-function -- fire and forget
          currentPage.goto(event.url, { waitUntil: 'domcontentloaded' }).catch(() => {});
        }
        break;
      }

      case 'settings-updated': {
        updatedBrowserSettings = event.data;
        verbose(`Settings updated: ${JSON.stringify(event.data)}`);
        save();
        break;
      }

      case 'hidden-elements-updated': {
        const { domain, selectors } = event;
        hiddenElements = selectors.length === 0
          ? Object.fromEntries(Object.entries(hiddenElements).filter(([k]) => k !== domain))
          : { ...hiddenElements, [domain]: selectors };
        verbose(`Hidden elements updated for ${domain}: ${selectors.length} selectors`);
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
          hiddenElements,
          onEvent: handleEvent,
        });
        verbose(`Toolbar injected on ${url}`);
      } catch (error) {
        // Toolbar injection can fail on some pages (e.g., CSP restrictions)
        verbose(
          `Toolbar injection failed on ${url}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  };

  const handlePageClose = (page: Page) => {
    page.on('close', () => {
      if (context.pages().length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- fire and forget browser close
        browser.close().catch(() => {});
      }
    });
  };

  const initPage = (page: Page) => {
    setupPage(page);
    handlePageClose(page);
  };
  context.on('page', initPage);

  const page = context.pages()[0] ?? (await context.newPage());
  initPage(page);

  // Navigate to heroshot.sh welcome page
  await page.goto('https://heroshot.sh/welcome', { waitUntil: 'domcontentloaded' });

  // Explicitly inject toolbar after initial navigation (event listener may miss first load)
  try {
    await injectToolbar(page, {
      screenshots: allScreenshots,
      pendingJob,
      selectedId,
      sidebarExpanded,
      hiddenElements,
      onEvent: handleEvent,
    });
    verbose('Toolbar injected on welcome page');
  } catch (error) {
    verbose(
      `Initial toolbar injection failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Wait for browser to close (either via Close button or manual close)
  await new Promise<void>(resolve => {
    browser.once('disconnected', () => resolve());
  });

  if (isNewKey) {
    note(
      'To print your session key:\n  npx heroshot session-key\n\nFor CI, add HEROSHOT_SESSION_KEY as a repository secret.',
      'Session encrypted'
    );
  }

  return { hasScreenshots: allScreenshots.length > 0 };
}
