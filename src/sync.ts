import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { ElementHandle, Page } from 'playwright';
import { launchPersistentBrowser } from './browser';
import { getConfigPath, loadConfig } from './configFile';
import { log } from './logger';
import type { Config, Screenshot } from './types';

/**
 * Find element using shadow-piercing selector with retries
 * The >>> syntax pierces shadow DOM boundaries
 */
async function findElement(
  page: Page,
  selector: string,
  maxAttempts = 10,
  intervalMs = 500
): Promise<ElementHandle | null> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Run shadow-piercing query in browser context
    // The function body runs in browser where DOM types exist
    const handle = await page.evaluateHandle(`
      (() => {
        const selector = ${JSON.stringify(selector)};
        const parts = selector.split('>>>').map((part) => part.trim());
        let current = document;

        for (const part of parts) {
          if (!part) continue;

          const root = current instanceof Element
            ? (current.shadowRoot ?? current)
            : current;

          const found = root.querySelector(part);
          if (!found) return null;

          current = found;
        }

        return current instanceof Element ? current : null;
      })()
    `);

    // Check if we got an element (not null/undefined)
    const element = handle.asElement();
    if (element) {
      return element;
    }

    // Dispose the handle if it's not an element
    await handle.dispose();

    if (attempt < maxAttempts) {
      await page.waitForTimeout(intervalMs);
    }
  }

  return null;
}

/**
 * Add suffix to filename before extension
 * e.g., "hero.png" + "-dark" => "hero-dark.png"
 */
function addFilenameSuffix(filename: string, suffix: string): string {
  const extension = path.extname(filename);
  const base = path.basename(filename, extension);
  const directory = path.dirname(filename);
  return path.join(directory, `${base}${suffix}${extension}`);
}

interface CaptureOptions {
  /** Output format (png or jpeg) */
  format: 'png' | 'jpeg';
  /** JPEG quality (1-100) */
  quality: number;
}

/**
 * Capture a single screenshot
 */
async function captureScreenshot(
  page: Page,
  screenshot: Screenshot,
  outputDirectory: string,
  captureOptions: CaptureOptions,
  filenameSuffix = ''
): Promise<{ success: boolean; error?: string }> {
  const { name, url, selector, filename } = screenshot;
  const { format, quality } = captureOptions;
  const finalFilename = filenameSuffix ? addFilenameSuffix(filename, filenameSuffix) : filename;

  log.verbose(`  ${name}${filenameSuffix}...`);

  // Navigate to URL and wait for network to settle
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to navigate: ${message}` };
  }

  // Extra wait for dynamic content (web components, lazy loading)
  await page.waitForTimeout(1000);

  const outputPath = path.join(outputDirectory, finalFilename);

  // Ensure output directory exists
  const outputDirectoryPath = path.dirname(outputPath);
  if (!existsSync(outputDirectoryPath)) {
    mkdirSync(outputDirectoryPath, { recursive: true });
  }

  if (selector) {
    // Find element with shadow-piercing selector
    const element = await findElement(page, selector);

    if (!element) {
      return {
        success: false,
        error: `Element not found: ${selector}`,
      };
    }

    // Screenshot the element
    try {
      await (format === 'jpeg'
        ? element.screenshot({ path: outputPath, type: 'jpeg', quality })
        : element.screenshot({ path: outputPath, type: 'png' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Screenshot failed: ${message}` };
    }
  } else {
    // Full page screenshot
    try {
      await (format === 'jpeg'
        ? page.screenshot({ path: outputPath, fullPage: false, type: 'jpeg', quality })
        : page.screenshot({ path: outputPath, fullPage: false, type: 'png' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Screenshot failed: ${message}` };
    }
  }

  return { success: true };
}

/**
 * Get array of color schemes to capture based on config setting
 */
function getColorSchemes(setting?: 'light' | 'dark' | 'both'): ('light' | 'dark')[] {
  if (setting === 'both') return ['light', 'dark'];
  if (setting) return [setting];
  return [];
}

interface ScreenshotResult {
  id: string;
  name: string;
  success: boolean;
  error?: string;
}

/**
 * Capture screenshot and log result
 */
async function captureAndLog(
  page: Page,
  screenshot: Screenshot,
  outputDirectory: string,
  captureOptions: CaptureOptions,
  suffix: string
): Promise<ScreenshotResult> {
  const result = await captureScreenshot(page, screenshot, outputDirectory, captureOptions, suffix);
  const filename = suffix ? addFilenameSuffix(screenshot.filename, suffix) : screenshot.filename;

  if (result.success) {
    log.verbose(`    Saved: ${filename}`);
  } else {
    log.error(`  ${screenshot.name}${suffix}: ${result.error ?? 'Unknown error'}`);
  }

  return {
    id: `${screenshot.id}${suffix}`,
    name: `${screenshot.name}${suffix}`,
    success: result.success,
    error: result.error,
  };
}

interface SyncOptions {
  id?: string;
}

interface SyncResult {
  total: number;
  success: number;
  failed: number;
  results: ScreenshotResult[];
}

/**
 * Sync all screenshots defined in config
 */
export async function sync(options: SyncOptions = {}): Promise<SyncResult> {
  const configPath = getConfigPath();
  const config: Config = loadConfig(configPath);

  if (config.screenshots.length === 0) {
    log('No screenshots defined.');
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  // Filter by ID if specified
  const { id: filterId } = options;
  const screenshots = filterId
    ? config.screenshots.filter(screenshot => screenshot.id === filterId)
    : config.screenshots;

  if (filterId && screenshots.length === 0) {
    log(`No screenshot found with ID: ${filterId}`);
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  log.verbose(`Syncing ${screenshots.length} screenshot(s)...`);

  // Get output directory (relative to config file location)
  const configDirectory = path.dirname(configPath);
  const outputDirectory = path.resolve(configDirectory, config.outputDirectory);

  // Launch browser with persistent profile (reuses auth sessions)
  const viewport = config.browser?.viewport ?? { width: 1280, height: 800 };
  const context = await launchPersistentBrowser({
    headless: true,
    viewport,
  });

  const page = await context.newPage();

  // Determine which color schemes to capture
  const colorSchemeSetting = config.browser?.colorScheme;
  const schemes = getColorSchemes(colorSchemeSetting);

  // Build capture options from config
  const captureOptions: CaptureOptions = {
    format: config.outputFormat ?? 'png',
    quality: config.jpegQuality,
  };

  const results: ScreenshotResult[] = [];

  for (const screenshot of screenshots) {
    if (schemes.length === 0) {
      // No color scheme specified - capture once with browser default
      const result = await captureAndLog(page, screenshot, outputDirectory, captureOptions, '');
      results.push(result);
    } else {
      // Capture for each color scheme
      for (const scheme of schemes) {
        await page.emulateMedia({ colorScheme: scheme });
        const suffix = schemes.length > 1 ? `-${scheme}` : '';
        const result = await captureAndLog(
          page,
          screenshot,
          outputDirectory,
          captureOptions,
          suffix
        );
        results.push(result);
      }
    }
  }

  await context.close();

  const { length: totalCount } = results;
  const successfulResults = results.filter(({ success }) => success);
  const { length: successCount } = successfulResults;
  const failedCount = totalCount - successCount;

  if (failedCount > 0) {
    log(`Done: ${successCount}/${totalCount} screenshots (${failedCount} failed)`);
  } else {
    log(`Done: ${successCount} screenshot${successCount === 1 ? '' : 's'} captured`);
  }

  return {
    total: totalCount,
    success: successCount,
    failed: failedCount,
    results,
  };
}
