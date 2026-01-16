import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContextOptions, ElementHandle, Page } from 'playwright';
import { launchBrowser } from './browser';
import { getConfigPath, loadConfig } from './configFile';
import { getSessionKey, loadSession, sessionExists } from './session';
import type { Config, Screenshot } from './types';
import { colors, error as logError, outro, spinner, verbose, warn } from './ui';
import { addSuffix } from './utils/addSuffix';
import { getColorSchemes } from './utils/getColorSchemes';
import { parseViewport } from './utils/parseViewport';

/**
 * Get the visible background color of an element by walking up the DOM tree.
 * Returns the first non-transparent background color found, or white as fallback.
 * Must be executed in browser context via page.evaluate().
 */
const GET_BACKGROUND_COLOR_SCRIPT = String.raw`
  (element) => {
    const toHex = (bgColor) => {
      const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
        const red = parseInt(rgbMatch[1], 10);
        const green = parseInt(rgbMatch[2], 10);
        const blue = parseInt(rgbMatch[3], 10);
        return '#' + red.toString(16).padStart(2, '0') + green.toString(16).padStart(2, '0') + blue.toString(16).padStart(2, '0');
      }
      return bgColor;
    };

    const isOpaque = (bgColor) => bgColor && bgColor !== 'transparent' && !bgColor.startsWith('rgba(0, 0, 0, 0)');

    // Walk up DOM tree from element
    let current = element;
    while (current) {
      const style = globalThis.getComputedStyle(current);
      const bgColor = style.backgroundColor;

      if (isOpaque(bgColor)) {
        return toHex(bgColor);
      }

      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        current = root.host;
      } else {
        current = current.parentElement;
      }
    }

    // Fallback: check body and html
    const bodyBg = globalThis.getComputedStyle(document.body).backgroundColor;
    if (isOpaque(bodyBg)) return toHex(bodyBg);

    const htmlBg = globalThis.getComputedStyle(document.documentElement).backgroundColor;
    if (isOpaque(htmlBg)) return toHex(htmlBg);

    return '#ffffff';
  }
`;

/**
 * Inject temporary mask divs to fill padding areas with background color.
 * Script runs in browser context via page.evaluate().
 */
async function injectPaddingMask(
  page: Page,
  element: ElementHandle,
  padding: { top: number; right: number; bottom: number; left: number },
  bgColor: string
): Promise<void> {
  const box = await element.boundingBox();
  if (!box) return;

  // Inject mask using string-based evaluate (browser context)
  await page.evaluate(`
    (() => {
      const box = ${JSON.stringify(box)};
      const padding = ${JSON.stringify(padding)};
      const bgColor = ${JSON.stringify(bgColor)};
      const maskId = 'heroshot-padding-mask';

      // Remove any existing mask
      document.querySelector('#' + maskId)?.remove();

      const container = document.createElement('div');
      container.id = maskId;
      container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483646;';

      // Top mask
      if (padding.top > 0) {
        const top = document.createElement('div');
        top.style.cssText = 'position:absolute;top:' + (box.y - padding.top) + 'px;left:' + (box.x - padding.left) + 'px;width:' + (box.width + padding.left + padding.right) + 'px;height:' + padding.top + 'px;background:' + bgColor + ';';
        container.append(top);
      }

      // Bottom mask
      if (padding.bottom > 0) {
        const bottom = document.createElement('div');
        bottom.style.cssText = 'position:absolute;top:' + (box.y + box.height) + 'px;left:' + (box.x - padding.left) + 'px;width:' + (box.width + padding.left + padding.right) + 'px;height:' + padding.bottom + 'px;background:' + bgColor + ';';
        container.append(bottom);
      }

      // Left mask
      if (padding.left > 0) {
        const left = document.createElement('div');
        left.style.cssText = 'position:absolute;top:' + box.y + 'px;left:' + (box.x - padding.left) + 'px;width:' + padding.left + 'px;height:' + box.height + 'px;background:' + bgColor + ';';
        container.append(left);
      }

      // Right mask
      if (padding.right > 0) {
        const right = document.createElement('div');
        right.style.cssText = 'position:absolute;top:' + box.y + 'px;left:' + (box.x + box.width) + 'px;width:' + padding.right + 'px;height:' + box.height + 'px;background:' + bgColor + ';';
        container.append(right);
      }

      document.body.append(container);
    })()
  `);
}

/**
 * Remove injected padding mask.
 * Script runs in browser context via page.evaluate().
 */
async function removePaddingMask(page: Page): Promise<void> {
  await page.evaluate(`document.querySelector('#heroshot-padding-mask')?.remove()`);
}

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

type CaptureOptions = {
  /** Output format (png or jpeg) */
  format: 'png' | 'jpeg';
  /** JPEG quality (1-100) */
  quality: number;
};

/**
 * Take a screenshot with the given options
 * When capturing a page without clip, uses fullPage: true for full scrollable content
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
      // No selector = full page screenshot (entire scrollable content)
      await target.screenshot({ path: outputPath, type: 'jpeg', quality, fullPage: true });
    } else {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality });
    }
  } else if (isPage && clip) {
    await target.screenshot({ path: outputPath, type: 'png', clip });
  } else if (isPage) {
    // No selector = full page screenshot (entire scrollable content)
    await target.screenshot({ path: outputPath, type: 'png', fullPage: true });
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
  const { name, url, selector, filename, padding, scroll, maskPadding } = screenshot;
  const { format, quality } = captureOptions;
  const finalFilename = filenameSuffix ? addSuffix(filename, filenameSuffix) : filename;

  verbose(`Capturing: ${name}${filenameSuffix}`);

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

        // If maskPadding is enabled, inject temporary divs to fill padding with background color
        if (maskPadding) {
          // Detect background color - re-find element fresh to handle theme re-renders
          // HA re-renders components when theme changes, invalidating ElementHandles
          // Use string-based evaluate to run entirely in browser context
          const bgColorResult = await page.evaluate(`
            (() => {
              const selector = ${JSON.stringify(selector)};
              const parts = selector.split('>>>').map((p) => p.trim());
              let current = document;

              for (const part of parts) {
                if (!part) continue;
                const root = current instanceof Element ? (current.shadowRoot ?? current) : current;
                const found = root.querySelector(part);
                if (!found) return '#ffffff';
                current = found;
              }

              if (!(current instanceof Element)) return '#ffffff';

              // Run detection script inline
              const detectBg = ${GET_BACKGROUND_COLOR_SCRIPT};
              return detectBg(current);
            })()
          `);

          const bgColor = typeof bgColorResult === 'string' ? bgColorResult : '#ffffff';
          verbose(`Background color: ${bgColor}`);
          await injectPaddingMask(page, element, padding, bgColor);
        }

        // Calculate expanded clip region
        const clip = {
          x: Math.max(0, box.x - padding.left),
          y: Math.max(0, box.y - padding.top),
          width: box.width + padding.left + padding.right,
          height: box.height + padding.top + padding.bottom,
        };

        await takeScreenshot(page, outputPath, format, quality, clip);

        // Clean up mask after screenshot
        if (maskPadding) {
          await removePaddingMask(page);
        }
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

type ScreenshotResult = {
  id: string;
  name: string;
  success: boolean;
  error?: string;
};

/**
 * Retry delays in milliseconds (exponential backoff up to 5s)
 */
const RETRY_DELAYS = [500, 1000, 2000, 3000, 5000];

/**
 * Capture screenshot and log result (with retries)
 */
async function captureAndLog(
  page: Page,
  screenshot: Screenshot,
  outputDirectory: string,
  captureOptions: CaptureOptions,
  suffix: string
): Promise<ScreenshotResult> {
  const filename = suffix ? addSuffix(screenshot.filename, suffix) : screenshot.filename;
  const { length: maxRetries } = RETRY_DELAYS;
  let result: { success: boolean; error?: string } = { success: false };

  // Try up to 5 times with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    result = await captureScreenshot(page, screenshot, outputDirectory, captureOptions, suffix);

    if (result.success) {
      verbose(`Saved: ${filename}`);
      break;
    }

    // Wait before next retry (if not last attempt)
    if (attempt < maxRetries - 1) {
      const delay = RETRY_DELAYS[attempt] ?? 1000;
      verbose(
        `Retry ${String(attempt + 1)}/${String(maxRetries)} for ${filename} in ${String(delay)}ms...`
      );
      await page.waitForTimeout(delay);
    }
  }

  // Error logging is handled by the main sync loop

  return {
    id: `${screenshot.id}${suffix}`,
    name: `${screenshot.name}${suffix}`,
    success: result.success,
    error: result.error,
  };
}

type SyncOptions = {
  /** Pattern to filter screenshots by id, name, or filename (case-insensitive substring match) */
  filter?: string;
  /** Path to config file (loads config from file) */
  configPath?: string;
  /** Config object (use directly, skip file loading) */
  config?: Config;
  /** Output directory override (for URL capture mode where there's no config file) */
  outputDirectory?: string;
  sessionKey?: string;
};

/**
 * Load encrypted session if available
 */
// eslint-disable-next-line sonarjs/function-return-type -- union return is intentional
function loadEncryptedSession(
  sessionKeyOption?: string
): BrowserContextOptions['storageState'] | undefined {
  const sessionKey = getSessionKey(sessionKeyOption);
  if (!sessionKey || !sessionExists()) {
    return undefined;
  }

  const state = loadSession(sessionKey);
  if (state) {
    verbose('Using encrypted session');
    // eslint-disable-next-line no-restricted-syntax -- deserialized session data
    return state as BrowserContextOptions['storageState'];
  }

  verbose('Failed to decrypt session - using fresh browser');
  return undefined;
}

type SyncResult = {
  total: number;
  success: number;
  failed: number;
  results: ScreenshotResult[];
};

/**
 * Show capture results and return summary
 */
function showResults(results: ScreenshotResult[], outputDirectory: string): SyncResult {
  const { length: totalCount } = results;
  const successfulResults = results.filter(({ success }) => success);
  const { length: successCount } = successfulResults;
  const failedCount = totalCount - successCount;

  if (failedCount > 0) {
    for (const result of results) {
      if (!result.success) {
        logError(`${result.name}: ${result.error ?? 'Unknown error'}`);
      }
    }
    outro(`${colors.red(`${failedCount} failed`)}, ${successCount} captured`);
  } else {
    outro(
      `${successCount} screenshot${successCount === 1 ? '' : 's'} saved to ${colors.dim(outputDirectory + '/')}`
    );
  }

  return { total: totalCount, success: successCount, failed: failedCount, results };
}

/**
 * Sync all screenshots defined in config
 */
// eslint-disable-next-line complexity -- main entry point, complexity is acceptable
export async function sync(options: SyncOptions = {}): Promise<SyncResult> {
  // Use provided config or load from file
  const configPath = options.configPath ?? getConfigPath();
  const config: Config = options.config ?? loadConfig(configPath);

  if (config.screenshots.length === 0) {
    warn('No screenshots defined.');
    outro('Run "heroshot config" to add screenshots');
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  // Filter by pattern if specified (matches id, name, or filename - case-insensitive)
  const { filter: filterPattern } = options;
  const screenshots = filterPattern
    ? config.screenshots.filter(screenshot => {
        const pattern = filterPattern.toLowerCase();
        return (
          screenshot.id.toLowerCase().includes(pattern) ||
          screenshot.name.toLowerCase().includes(pattern) ||
          screenshot.filename.toLowerCase().includes(pattern)
        );
      })
    : config.screenshots;

  if (filterPattern && screenshots.length === 0) {
    logError(`No screenshots matching: ${filterPattern}`);
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  // Log which screenshots matched the filter
  if (filterPattern && screenshots.length > 0) {
    const names = screenshots.map(({ name }) => name).join(', ');
    verbose(`Matched ${screenshots.length}: ${names}`);
  }

  // Get output directory
  // - If outputDirectory override provided (URL capture mode), use it directly
  // - Otherwise, resolve relative to project root (parent of .heroshot/)
  let outputDirectory: string;
  if (options.outputDirectory) {
    outputDirectory = path.resolve(options.outputDirectory);
  } else {
    const configDirectory = path.dirname(configPath);
    const projectRoot = path.dirname(configDirectory);
    outputDirectory = path.resolve(projectRoot, config.outputDirectory);
  }

  // Try to load encrypted session if available
  const storageState = loadEncryptedSession(options.sessionKey);

  // Start the capture spinner
  const captureSpinner = spinner();
  captureSpinner.start('Launching browser...');

  // Determine which color schemes to capture
  const colorSchemeSetting = config.browser?.colorScheme;
  const schemes = getColorSchemes(colorSchemeSetting);

  // Build capture options from config
  const captureOptions: CaptureOptions = {
    format: config.outputFormat ?? 'png',
    quality: config.jpegQuality,
  };

  // Common browser options
  const defaultViewport = config.browser?.viewport ?? { width: 1280, height: 800 };
  const deviceScaleFactor = config.browser?.deviceScaleFactor;

  // Calculate total captures (screenshots × viewports × colorSchemes)
  let totalToCapture = 0;
  const schemeCount = Math.max(1, schemes.length);
  for (const screenshot of screenshots) {
    const viewportCount = screenshot.viewports?.length ?? 1;
    totalToCapture += viewportCount * schemeCount;
  }

  const results: ScreenshotResult[] = [];
  let capturedCount = 0;

  // Capture helper - creates context with specific color scheme
  const captureWithScheme = async (colorScheme?: 'light' | 'dark') => {
    const { browser, context } = await launchBrowser({
      headless: true,
      viewport: defaultViewport,
      deviceScaleFactor,
      storageState,
      colorScheme,
    });

    const page = await context.newPage();

    // Explicitly set color scheme on the page (in addition to context setting)
    if (colorScheme) {
      await page.emulateMedia({ colorScheme });
    }

    const hasMultipleSchemes = schemes.length > 1;

    for (const screenshot of screenshots) {
      // Get viewports for this screenshot (or use single default)
      const viewportVariants = screenshot.viewports ?? [];
      const hasMultipleViewports = viewportVariants.length > 1;

      if (viewportVariants.length === 0) {
        // No viewports specified - use default viewport, just add colorScheme suffix if needed
        capturedCount++;
        const suffix = hasMultipleSchemes && colorScheme ? `-${colorScheme}` : '';
        captureSpinner.message(
          `Capturing ${capturedCount}/${totalToCapture}: ${screenshot.name}${suffix}`
        );
        const result = await captureAndLog(
          page,
          screenshot,
          outputDirectory,
          captureOptions,
          suffix
        );
        results.push(result);
      } else {
        // Capture for each viewport variant
        for (const variant of viewportVariants) {
          const parsedViewport = parseViewport(variant);

          // Resize page for this viewport
          await page.setViewportSize({
            width: parsedViewport.width,
            height: parsedViewport.height,
          });

          capturedCount++;
          // Build suffix: -viewport-colorScheme (only add parts if multiple variants exist)
          const viewportSuffix = hasMultipleViewports ? `-${parsedViewport.name}` : '';
          const schemeSuffix = hasMultipleSchemes && colorScheme ? `-${colorScheme}` : '';
          const suffix = `${viewportSuffix}${schemeSuffix}`;

          captureSpinner.message(
            `Capturing ${capturedCount}/${totalToCapture}: ${screenshot.name}${suffix}`
          );
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

    await browser.close();
  };

  if (schemes.length === 0) {
    // No color scheme specified - capture once with browser default
    await captureWithScheme();
  } else {
    // Capture for each color scheme (separate browser context for each)
    for (const scheme of schemes) {
      await captureWithScheme(scheme);
    }
  }

  captureSpinner.stop('Screenshots captured');

  return showResults(results, config.outputDirectory);
}
