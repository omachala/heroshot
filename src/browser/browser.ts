import type { BrowserContextOptions, Page } from 'playwright';
import { ensureHeroshotDirectory, getConfigPath, loadConfig } from '../configFile';
import {
  generateSessionKey,
  loadLocalKey,
  loadSession,
  saveLocalKey,
  sessionExists,
} from '../session';
import { note, spinner, verbose } from '../ui';
import { configToScreenshotData } from './configToScreenshotData';
import { DEFAULT_VIEWPORT } from './constants';
import { type BrowserState, createEventHandler } from './handleEvent';
import { injectToolbar } from './injectToolbar';
import { launchBrowser } from './launchBrowser';
import type { BrowserSettings, ScreenshotData, SetupOptions } from './types';

export async function setup(options: SetupOptions = {}): Promise<{ hasScreenshots: boolean }> {
  const setupSpinner = spinner();
  setupSpinner.start('Launching browser...');
  ensureHeroshotDirectory();

  const configPath = getConfigPath();
  const config = loadConfig(configPath);
  const viewport = config.browser?.viewport ?? DEFAULT_VIEWPORT;

  let sessionKey = loadLocalKey();
  const isNewKey = !sessionKey;
  if (!sessionKey) {
    sessionKey = generateSessionKey();
    saveLocalKey(sessionKey);
  }

  let storageState: BrowserContextOptions['storageState'] | undefined;
  if (sessionExists()) {
    const state = loadSession(sessionKey);
    if (state) {
      // eslint-disable-next-line no-restricted-syntax -- deserialized session data
      storageState = state as BrowserContextOptions['storageState'];
      verbose('Loaded existing session');
    }
  }

  const allScreenshots: ScreenshotData[] = configToScreenshotData(config.screenshots);

  const initialSettings: BrowserSettings = {
    viewport,
    ...(options.colorScheme && { colorScheme: options.colorScheme }),
    ...(config.browser?.deviceScaleFactor && {
      deviceScaleFactor: config.browser.deviceScaleFactor,
    }),
    outputDirectory: config.outputDirectory,
    outputFormat: config.outputFormat,
    jpegQuality: config.jpegQuality,
    workers: config.workers,
  };

  const browserState: BrowserState = {
    allScreenshots,
    pendingJob: null,
    selectedId: null,
    sidebarExpanded: false,
    updatedBrowserSettings: null,
    hiddenElements: config.hiddenElements ?? {},
    configPath,
    sessionKey,
  };

  const { browser, context } = await launchBrowser({
    headless: false,
    viewport,
    storageState,
    colorScheme: options.colorScheme,
  });

  setupSpinner.stop('Browser ready');

  const handleEvent = createEventHandler(browserState, browser, context);

  const injectOptions = () => ({
    screenshots: browserState.allScreenshots,
    settings: initialSettings,
    pendingJob: browserState.pendingJob,
    selectedId: browserState.selectedId,
    sidebarExpanded: browserState.sidebarExpanded,
    hiddenElements: browserState.hiddenElements,
    onEvent: handleEvent,
  });

  const setupPage = (page: Page) => {
    page.on('domcontentloaded', async () => {
      const url = page.url();
      if (!url.startsWith('http')) return;
      try {
        await injectToolbar(page, injectOptions());
        verbose(`Toolbar injected on ${url}`);
      } catch (error) {
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

  await page.goto('https://heroshot.dev/welcome', { waitUntil: 'domcontentloaded' });

  try {
    await injectToolbar(page, injectOptions());
    verbose('Toolbar injected on welcome page');
  } catch (error) {
    verbose(
      `Initial toolbar injection failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

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
