import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContextOptions, ElementHandle, Page } from 'playwright';
import { launchBrowser } from './browser';
import { getConfigPath, loadConfig } from './configFile';
import { getSessionKey, loadSession, sessionExists } from './session';
import type { Config, Screenshot } from './types';
import { colors, error as logError, outro, spinner, verbose, warn } from './ui';
import { getColorSchemes } from './utils/getColorSchemes';
import { parseViewport } from './utils/parseViewport';
import { generateScreenshotFilename } from './utils/screenshotPath';

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
 * Apply text overrides to elements on the page
 */
async function applyTextOverrides(
  page: Page,
  selector: string,
  textOverrides: Record<string, string>
): Promise<void> {
  await page.evaluate(`
    (() => {
      const mainSelector = ${JSON.stringify(selector)};
      const overrides = ${JSON.stringify(textOverrides)};

      // Find main element (with shadow-piercing support)
      const parts = mainSelector.split('>>>').map((p) => p.trim());
      let mainElement = document;
      for (const part of parts) {
        if (!part) continue;
        const root = mainElement instanceof Element ? (mainElement.shadowRoot ?? mainElement) : mainElement;
        const found = root.querySelector(part);
        if (!found) return;
        mainElement = found;
      }

      if (!(mainElement instanceof Element)) return;

      // Apply each text override
      for (const [relativeSelector, newText] of Object.entries(overrides)) {
        const textEl = mainElement.querySelector(relativeSelector);
        if (textEl) {
          textEl.textContent = newText;
        }
      }
    })()
  `);
  // Small wait for DOM to update
  await page.waitForTimeout(50);
}

type ElementCaptureOptions = {
  page: Page;
  element: ElementHandle;
  selector: string;
  outputPath: string;
  format: 'png' | 'jpeg';
  quality: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  maskPadding?: boolean;
};

/**
 * Capture element screenshot with optional padding and mask
 */
async function captureElementScreenshot(
  options: ElementCaptureOptions
): Promise<{ success: boolean; error?: string }> {
  const { page, element, selector, outputPath, format, quality, padding, maskPadding } = options;
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

  return { success: true };
}

type CaptureVariant = {
  /** Viewport name for filename suffix (only if multiple viewports) */
  viewportName?: string;
  /** Color scheme for filename suffix (only if multiple schemes) */
  colorScheme?: 'light' | 'dark';
};

/**
 * Capture a single screenshot
 */
async function captureScreenshot(
  page: Page,
  screenshot: Screenshot,
  outputDirectory: string,
  captureOptions: CaptureOptions,
  variant: CaptureVariant = {}
): Promise<{ success: boolean; error?: string; filename: string }> {
  const { name, url, selector, padding, scroll, maskPadding, textOverrides } = screenshot;
  const { format, quality } = captureOptions;

  // Generate filename from name + variant
  const filename = generateScreenshotFilename({
    name,
    viewport: variant.viewportName,
    colorScheme: variant.colorScheme,
    format,
  });

  const suffix = [variant.viewportName, variant.colorScheme].filter(Boolean).join('-');
  verbose(`Capturing: ${name}${suffix ? ` (${suffix})` : ''}`);

  // Navigate to URL and wait for DOM to be ready
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to navigate: ${message}`, filename };
  }

  // Wait for page to stabilize (images, fonts, dynamic content)
  await page.waitForTimeout(2000);

  // Restore scroll position if saved
  if (scroll) {
    await page.evaluate(`window.scrollTo(${scroll.x}, ${scroll.y})`);
    // Small wait for scroll to complete and any scroll-triggered content to load
    await page.waitForTimeout(100);
  }

  const outputPath = path.join(outputDirectory, filename);

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
        return { success: false, error: `Element not found: ${selector}`, filename };
      }

      // Apply text overrides if any
      if (textOverrides && Object.keys(textOverrides).length > 0) {
        await applyTextOverrides(page, selector, textOverrides);
      }

      // Capture element with or without padding
      const captureResult = await captureElementScreenshot({
        page,
        element,
        selector,
        outputPath,
        format,
        quality,
        padding,
        maskPadding,
      });
      if (!captureResult.success) {
        return { ...captureResult, filename };
      }
    } else {
      // Full page screenshot
      await takeScreenshot(page, outputPath, format, quality);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Screenshot failed: ${message}`, filename };
  }

  return { success: true, filename };
}

type ScreenshotResult = {
  id: string;
  name: string;
  filename: string;
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
  variant: CaptureVariant
): Promise<ScreenshotResult> {
  const { length: maxRetries } = RETRY_DELAYS;
  let result: { success: boolean; error?: string; filename: string } = {
    success: false,
    filename: '',
  };

  // Try up to 5 times with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    result = await captureScreenshot(page, screenshot, outputDirectory, captureOptions, variant);

    if (result.success) {
      verbose(`Saved: ${result.filename}`);
      break;
    }

    // Wait before next retry (if not last attempt)
    if (attempt < maxRetries - 1) {
      const delay = RETRY_DELAYS[attempt] ?? 1000;
      verbose(
        `Retry ${String(attempt + 1)}/${String(maxRetries)} for ${result.filename} in ${String(delay)}ms...`
      );
      await page.waitForTimeout(delay);
    }
  }

  // Build display name with variant info
  const suffix = [variant.viewportName, variant.colorScheme].filter(Boolean).join('-');
  const displayName = suffix ? `${screenshot.name} (${suffix})` : screenshot.name;

  return {
    id: `${screenshot.id}${suffix ? `-${suffix}` : ''}`,
    name: displayName,
    filename: result.filename,
    success: result.success,
    error: result.error,
  };
}

type SyncOptions = {
  /** Pattern to filter screenshots by id or name (case-insensitive substring match) */
  filter?: string;
  /** Path to config file (loads config from file) */
  configPath?: string;
  /** Config object (use directly, skip file loading) */
  config?: Config;
  /** Output directory override (for URL capture mode where there's no config file) */
  outputDirectory?: string;
  sessionKey?: string;
  /** Delete stale files in output directory (only works when running full sync without filter) */
  clean?: boolean;
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
  staleFiles?: string[];
  deletedFiles?: string[];
};

/**
 * Get list of existing screenshot files in output directory
 */
function getExistingFiles(outputDirectory: string): string[] {
  if (!existsSync(outputDirectory)) {
    return [];
  }
  try {
    return readdirSync(outputDirectory).filter(
      file => file.endsWith('.png') || file.endsWith('.jpg')
    );
  } catch {
    return [];
  }
}

/**
 * Delete stale files from output directory
 */
function deleteStaleFiles(outputDirectory: string, staleFiles: string[]): string[] {
  const deleted: string[] = [];
  for (const file of staleFiles) {
    try {
      unlinkSync(path.join(outputDirectory, file));
      deleted.push(file);
      verbose(`Deleted stale: ${file}`);
    } catch {
      // Ignore deletion errors
    }
  }
  return deleted;
}

/**
 * Show capture results and return summary
 */
function showResults(
  results: ScreenshotResult[],
  outputDirectory: string,
  staleFiles: string[],
  deletedFiles: string[]
): SyncResult {
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
  }

  // Build summary parts
  const parts: string[] = [];

  if (failedCount > 0) {
    parts.push(colors.red(`${failedCount} failed`));
  }

  parts.push(`${successCount} saved`);

  if (deletedFiles.length > 0) {
    parts.push(colors.yellow(`${deletedFiles.length} deleted`));
  } else if (staleFiles.length > 0) {
    parts.push(colors.dim(`${staleFiles.length} stale`));
  }

  outro(parts.join(', ') + ` to ${colors.dim(outputDirectory + '/')}`);

  // Log stale file hint if any (and not deleted)
  if (staleFiles.length > 0 && deletedFiles.length === 0) {
    warn(`Stale files found: ${staleFiles.join(', ')}`);
    verbose('Run with --clean to delete stale files');
  }

  return {
    total: totalCount,
    success: successCount,
    failed: failedCount,
    results,
    staleFiles: staleFiles.length > 0 ? staleFiles : undefined,
    deletedFiles: deletedFiles.length > 0 ? deletedFiles : undefined,
  };
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

  // Filter by pattern if specified (matches id or name - case-insensitive)
  const { filter: filterPattern } = options;
  const screenshots = filterPattern
    ? config.screenshots.filter(screenshot => {
        const pattern = filterPattern.toLowerCase();
        return (
          screenshot.id.toLowerCase().includes(pattern) ||
          screenshot.name.toLowerCase().includes(pattern)
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
        const variant: CaptureVariant = {
          colorScheme: hasMultipleSchemes ? colorScheme : undefined,
        };
        const suffix = variant.colorScheme ? ` (${variant.colorScheme})` : '';
        captureSpinner.message(
          `Capturing ${capturedCount}/${totalToCapture}: ${screenshot.name}${suffix}`
        );
        const result = await captureAndLog(
          page,
          screenshot,
          outputDirectory,
          captureOptions,
          variant
        );
        results.push(result);
      } else {
        // Capture for each viewport variant
        for (const viewportVariant of viewportVariants) {
          const parsedViewport = parseViewport(viewportVariant);

          // Resize page for this viewport
          await page.setViewportSize({
            width: parsedViewport.width,
            height: parsedViewport.height,
          });

          capturedCount++;
          const variant: CaptureVariant = {
            viewportName: hasMultipleViewports ? parsedViewport.name : undefined,
            colorScheme: hasMultipleSchemes ? colorScheme : undefined,
          };
          const suffix = [variant.viewportName, variant.colorScheme].filter(Boolean).join(', ');

          captureSpinner.message(
            `Capturing ${capturedCount}/${totalToCapture}: ${screenshot.name}${suffix ? ` (${suffix})` : ''}`
          );
          const result = await captureAndLog(
            page,
            screenshot,
            outputDirectory,
            captureOptions,
            variant
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

  // Stale file detection (only for full sync without filter)
  let staleFiles: string[] = [];
  let deletedFiles: string[] = [];

  if (!filterPattern) {
    // Get all existing files in output directory
    const existingFiles = getExistingFiles(outputDirectory);

    // Get all written filenames from results
    const writtenFiles = new Set(
      results.filter(({ success }) => success).map(({ filename }) => filename)
    );

    // Find stale files (exist but weren't written)
    staleFiles = existingFiles.filter(file => !writtenFiles.has(file));

    // Delete stale files if --clean flag is set
    if (options.clean && staleFiles.length > 0) {
      deletedFiles = deleteStaleFiles(outputDirectory, staleFiles);
    }
  }

  return showResults(results, outputDirectory, staleFiles, deletedFiles);
}
