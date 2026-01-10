import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { type BrowserContext, type Page, chromium } from 'playwright';
import type { Screenshot } from './config';
import { generateScreenshotId, getConfigPath, loadConfig, saveConfig } from './configFile';

const PROFILE_DIR = path.join(homedir(), '.heroshot', 'browser-profile');
const TOOLBAR_DIR = path.join(import.meta.dirname, '..', 'toolbar');

export function getProfilePath(): string {
  return PROFILE_DIR;
}

async function launchPersistentBrowser(
  options: { headless?: boolean } = {}
): Promise<BrowserContext> {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: options.headless ?? false,
    viewport: { width: 1280, height: 800 },
  });

  return context;
}

async function waitForUserInput(message: string): Promise<void> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    readline.question(message, () => {
      readline.close();
      resolve();
    });
  });
}

interface PickedElement {
  url: string;
  selector: string;
}

const exposedPages = new WeakSet<Page>();

async function injectPicker(page: Page, onPicked: (data: PickedElement) => void): Promise<void> {
  // Expose callback function to page (only once per page)
  if (!exposedPages.has(page)) {
    await page.exposeFunction('onElementPicked', (data: PickedElement) => {
      onPicked(data);
    });
    exposedPages.add(page);
  }

  // Inject CSS
  const cssPath = path.join(TOOLBAR_DIR, 'dist', 'heroshot.css');
  const css = readFileSync(cssPath, 'utf8');
  await page.addStyleTag({ content: css });

  // Inject JS
  const scriptPath = path.join(TOOLBAR_DIR, 'dist', 'toolbar.js');
  const script = readFileSync(scriptPath, 'utf8');
  await page.addScriptTag({ content: script });
}

export async function captureUrl(url: string, output: string): Promise<void> {
  console.log(`Capturing: ${url}`);

  const context = await launchPersistentBrowser({ headless: true });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: output, fullPage: false });

  await context.close();

  console.log(`Saved: ${output}`);
}

export async function setup(): Promise<void> {
  console.log('Opening browser for setup...');
  console.log(`Profile will be saved to: ${PROFILE_DIR}`);
  console.log('');

  const pickedElements: PickedElement[] = [];

  const onPicked = (data: PickedElement) => {
    pickedElements.push(data);
    console.log(`\nPicked: ${data.selector}`);
    console.log(`URL: ${data.url}`);
  };

  const context = await launchPersistentBrowser({ headless: false });

  const setupPage = (page: Page) => {
    // Inject on every navigation within the page
    page.on('domcontentloaded', async () => {
      const url = page.url();
      // Skip about:blank and other non-http pages
      if (!url.startsWith('http')) return;

      try {
        await injectPicker(page, onPicked);
      } catch {
        // Page might have closed or navigated away
      }
    });
  };

  // Handle new pages/tabs
  context.on('page', page => {
    setupPage(page);
  });

  const page = await context.newPage();
  setupPage(page);

  console.log('Browser is open.');
  console.log('1. Navigate to any site (e.g., https://example.com)');
  console.log('2. Click the picker icon in the toolbar to select elements');
  console.log('3. Press Enter here when done');
  console.log('');

  await waitForUserInput('Press Enter when done to save session and exit...');

  await context.close();

  console.log('');
  if (pickedElements.length > 0) {
    // Save to config
    const configPath = getConfigPath();
    const config = loadConfig(configPath);

    console.log('Picked elements:');
    for (const element of pickedElements) {
      const id = generateScreenshotId(element.url, element.selector);
      const screenshot: Screenshot = {
        id,
        url: element.url,
        selector: element.selector,
        output: `screenshots/${id}.png`,
      };

      // Add or update screenshot
      const existingIndex = config.screenshots.findIndex(item => item.id === id);
      if (existingIndex === -1) {
        config.screenshots.push(screenshot);
        console.log(`  - Added: ${id}`);
      } else {
        config.screenshots[existingIndex] = screenshot;
        console.log(`  - Updated: ${id}`);
      }
    }

    saveConfig(configPath, config);
    console.log(`\nSaved to: ${configPath}`);
  }
  console.log('Session saved. You can now use `heroshot sync` to capture screenshots.');
}
