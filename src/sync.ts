import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContextOptions, ElementHandle, Page } from 'playwright';
import { launchBrowser } from './browser';
import { getConfigPath, loadConfig } from './configFile';
import { getSessionKey, loadSession, sessionExists } from './session';
import type { Config, Screenshot } from './types';
import { colors, error as logError, outro, spinner, verbose, warn } from './ui';

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
  const { name, url, selector, filename, padding, scroll, maskPadding } = screenshot;
  const { format, quality } = captureOptions;
  const finalFilename = filenameSuffix ? addFilenameSuffix(filename, filenameSuffix) : filename;

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

/**
 * Get array of color schemes to capture based on config setting
 * - 'auto' = use browser default (no explicit scheme)
 * - 'light' = light only
 * - 'dark' = dark only
 * - undefined/null/anything else = both (light and dark)
 */
function getColorSchemes(setting?: 'auto' | 'light' | 'dark'): ('light' | 'dark')[] {
  if (setting === 'auto') return [];
  if (setting === 'light') return ['light'];
  if (setting === 'dark') return ['dark'];
  // Default: capture both
  return ['light', 'dark'];
}

interface ScreenshotResult {
  id: string;
  name: string;
  success: boolean;
  error?: string;
}

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
  const filename = suffix ? addFilenameSuffix(screenshot.filename, suffix) : screenshot.filename;
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

interface SyncOptions {
  id?: string;
  configPath?: string;
  sessionKey?: string;
}

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
  const configPath = options.configPath ?? getConfigPath();
  const config: Config = loadConfig(configPath);

  if (config.screenshots.length === 0) {
    warn('No screenshots defined.');
    outro('Run "heroshot config" to add screenshots');
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  // Filter by ID if specified
  const { id: filterId } = options;
  const screenshots = filterId
    ? config.screenshots.filter(screenshot => screenshot.id === filterId)
    : config.screenshots;

  if (filterId && screenshots.length === 0) {
    logError(`No screenshot found with ID: ${filterId}`);
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  // Get output directory (relative to project root, which is parent of .heroshot/)
  const configDirectory = path.dirname(configPath);
  const projectRoot = path.dirname(configDirectory);
  const outputDirectory = path.resolve(projectRoot, config.outputDirectory);

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
  const viewport = config.browser?.viewport ?? { width: 1280, height: 800 };
  const deviceScaleFactor = config.browser?.deviceScaleFactor;

  const results: ScreenshotResult[] = [];
  const totalToCapture = screenshots.length * Math.max(1, schemes.length);
  let capturedCount = 0;

  // Capture helper - creates context with specific color scheme
  const captureWithScheme = async (colorScheme?: 'light' | 'dark') => {
    const { browser, context } = await launchBrowser({
      headless: true,
      viewport,
      deviceScaleFactor,
      storageState,
      colorScheme,
    });

    const page = await context.newPage();

    // Explicitly set color scheme on the page (in addition to context setting)
    if (colorScheme) {
      await page.emulateMedia({ colorScheme });
    }

    const suffix = colorScheme && schemes.length > 1 ? `-${colorScheme}` : '';

    for (const screenshot of screenshots) {
      capturedCount++;
      captureSpinner.message(
        `Capturing ${capturedCount}/${totalToCapture}: ${screenshot.name}${suffix}`
      );
      const result = await captureAndLog(page, screenshot, outputDirectory, captureOptions, suffix);
      results.push(result);
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

  const { length: totalCount } = results;
  const successfulResults = results.filter(({ success }) => success);
  const { length: successCount } = successfulResults;
  const failedCount = totalCount - successCount;

  // Show results
  if (failedCount > 0) {
    // Show failed screenshots
    for (const result of results) {
      if (!result.success) {
        logError(`${result.name}: ${result.error ?? 'Unknown error'}`);
      }
    }
    outro(`${colors.red(`${failedCount} failed`)}, ${successCount} captured`);
  } else {
    outro(
      `${successCount} screenshot${successCount === 1 ? '' : 's'} saved to ${colors.dim(config.outputDirectory + '/')}`
    );
  }

  return {
    total: totalCount,
    success: successCount,
    failed: failedCount,
    results,
  };
}
