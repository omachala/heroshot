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
 * Take a screenshot with the given options
 */
async function takeScreenshot(
  target: Page | ElementHandle,
  outputPath: string,
  format: 'png' | 'jpeg',
  quality: number,
  clip?: { x: number; y: number; width: number; height: number }
): Promise<void> {
  const isPage = 'goto' in target;

  if (format === 'jpeg') {
    if (isPage && clip) {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality, clip });
    } else if (isPage) {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality, fullPage: false });
    } else {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality });
    }
  } else if (isPage && clip) {
    await target.screenshot({ path: outputPath, type: 'png', clip });
  } else if (isPage) {
    await target.screenshot({ path: outputPath, type: 'png', fullPage: false });
  } else {
    await target.screenshot({ path: outputPath, type: 'png' });
  }
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
  const { name, url, selector, filename, padding, scroll } = screenshot;
  const { format, quality } = captureOptions;
  const finalFilename = filenameSuffix ? addFilenameSuffix(filename, filenameSuffix) : filename;

  log.verbose(`  ${name}${filenameSuffix}...`);

  // Navigate to URL and wait for DOM to be ready
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to navigate: ${message}` };
  }

  // Wait for page to stabilize (images, fonts, dynamic content)
  await page.waitForTimeout(2000);

  // Restore scroll position if saved
  if (scroll) {
    await page.evaluate(`window.scrollTo(${scroll.x}, ${scroll.y})`);
    // Small wait for scroll to complete and any scroll-triggered content to load
    await page.waitForTimeout(100);
  }

  const outputPath = path.join(outputDirectory, finalFilename);

  // Ensure output directory exists
  const outputDirectoryPath = path.dirname(outputPath);
  if (!existsSync(outputDirectoryPath)) {
    mkdirSync(outputDirectoryPath, { recursive: true });
  }

  try {
    if (selector) {
      // Find element with shadow-piercing selector
      const element = await findElement(page, selector);

      if (!element) {
        return { success: false, error: `Element not found: ${selector}` };
      }

      // Check if padding is specified
      const hasPadding =
        padding && (padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0);

      if (hasPadding) {
        // Get element bounding box and expand by padding
        const box = await element.boundingBox();
        if (!box) {
          return { success: false, error: 'Could not get element bounding box' };
        }

        // Calculate expanded clip region
        const clip = {
          x: Math.max(0, box.x - padding.left),
          y: Math.max(0, box.y - padding.top),
          width: box.width + padding.left + padding.right,
          height: box.height + padding.top + padding.bottom,
        };

        await takeScreenshot(page, outputPath, format, quality, clip);
      } else {
        // No padding - use element screenshot directly
        await takeScreenshot(element, outputPath, format, quality);
      }
    } else {
      // Full page screenshot
      await takeScreenshot(page, outputPath, format, quality);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Screenshot failed: ${message}` };
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
  const deviceScaleFactor = config.browser?.deviceScaleFactor;
  const context = await launchPersistentBrowser({
    headless: true,
    viewport,
    deviceScaleFactor,
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
