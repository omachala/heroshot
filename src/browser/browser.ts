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
          // Fire and forget - we don't need to wait for this
          currentPage
            .evaluate(dispatchHighlightJob, {
              selector: event.selector,
              screenshotId: event.id,
            })
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- fire and forget, errors handled by toolbar
            .catch(() => {});
        } else {
          // Navigate to the page - toolbar will get job on inject
          pendingJob = {
            type: 'navigate-and-highlight',
            url: event.url,
            selector: event.selector,
            screenshotId: event.id,
          };
          // eslint-disable-next-line @typescript-eslint/no-empty-function -- fire and forget navigation
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
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- fire and forget browser close
        browser.close().catch(() => {});
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
