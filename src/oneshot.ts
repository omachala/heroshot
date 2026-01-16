import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContextOptions } from 'playwright';
import { launchBrowser } from './browser';
import { getSessionKey, loadSession, sessionExists } from './session';
import { colors, outro, spinner, verbose } from './ui';

/** Viewport preset dimensions */
const VIEWPORT_DESKTOP = { width: 1280, height: 800 };
const VIEWPORT_TABLET = { width: 768, height: 1024 };
const VIEWPORT_MOBILE = { width: 375, height: 667 };

export interface OneshotOptions {
  /** Target URL to capture */
  url: string;
  /** CSS selector(s) to capture - if multiple, captures bounding box of all */
  selector?: string[];
  /** Output filename (auto-generated from URL if not provided) */
  output?: string;
  /** Output directory (from config or CLI) */
  outputDirectory?: string;
  /** Padding around element in pixels */
  padding?: number;
  /** Viewport width */
  width?: number;
  /** Viewport height */
  height?: number;
  /** Use mobile viewport preset (375x667) */
  mobile?: boolean;
  /** Use tablet viewport preset (768x1024) */
  tablet?: boolean;
  /** Use desktop viewport preset (1280x800) */
  desktop?: boolean;
  /** Force dark color scheme */
  dark?: boolean;
  /** Force light color scheme */
  light?: boolean;
  /** Device scale factor (1, 2, 3) */
  scale?: number;
  /** Shortcut for scale=2 */
  retina?: boolean;
  /** Output format (png or jpeg) - from config or inferred from quality flag */
  format?: 'png' | 'jpeg';
  /** JPEG quality (1-100) - outputs JPEG instead of PNG */
  quality?: number;
  /** Omit background for transparent PNG */
  omitBackground?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Session key for encrypted auth */
  sessionKey?: string;
}

export interface OneshotResult {
  success: boolean;
  files: string[];
  error?: string;
}

/**
 * Generate a filename from URL
 * e.g., "https://example.com/foo/bar" -> "example-com-foo-bar.png"
 */
function generateFilename(url: string, format: 'png' | 'jpeg'): string {
  try {
    const parsed = new URL(url);
    const parts = [parsed.hostname, ...parsed.pathname.split('/').filter(Boolean)];
    const base = parts
      .join('-')
      .replaceAll(/[^\w-]/g, '-')
      .replaceAll(/-+/g, '-');
    return `${base || 'screenshot'}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  } catch {
    return `screenshot.${format === 'jpeg' ? 'jpg' : 'png'}`;
  }
}

/**
 * Add suffix to filename before extension
 */
function addSuffix(filename: string, suffix: string): string {
  const extension = path.extname(filename);
  const base = path.basename(filename, extension);
  const directory = path.dirname(filename);
  return path.join(directory, `${base}${suffix}${extension}`);
}

/**
 * Take a one-shot screenshot without config file
 */
// eslint-disable-next-line complexity, sonarjs/cognitive-complexity -- screenshot capture with many options
export async function oneshot(options: OneshotOptions): Promise<OneshotResult> {
  const {
    url,
    selector,
    output,
    outputDirectory,
    padding = 0,
    width,
    height,
    mobile,
    tablet,
    desktop,
    dark,
    light,
    scale,
    retina,
    format: formatOption,
    quality,
    omitBackground = false,
    timeout = 30_000,
    sessionKey,
  } = options;

  // Determine output format: CLI quality flag > explicit format > default png
  const format = quality === undefined ? (formatOption ?? 'png') : 'jpeg';
  const jpegQuality = quality ?? 80;

  // Generate output filename if not provided
  const filename = output ?? generateFilename(url, format);
  // Prepend output directory if specified
  const baseFilename = outputDirectory ? path.join(outputDirectory, filename) : filename;

  // Determine viewport
  let viewport = { ...VIEWPORT_DESKTOP };
  if (mobile) {
    viewport = { ...VIEWPORT_MOBILE };
  } else if (tablet) {
    viewport = { ...VIEWPORT_TABLET };
  } else if (desktop) {
    viewport = { ...VIEWPORT_DESKTOP };
  }
  if (width) viewport.width = width;
  if (height) viewport.height = height;

  // Determine device scale factor
  const deviceScaleFactor = retina ? 2 : (scale ?? 1);

  // Determine color schemes to capture
  // Using --light --dark together captures both variants
  const colorSchemes: ('light' | 'dark')[] = [];
  if (light) colorSchemes.push('light');
  if (dark) colorSchemes.push('dark');
  // Default: empty array means no preference (browser default)

  // Load session if available (same pattern as sync.ts)
  let storageState: BrowserContextOptions['storageState'];
  const resolvedSessionKey = getSessionKey(sessionKey);
  if (resolvedSessionKey && sessionExists()) {
    const session = loadSession(resolvedSessionKey);
    if (session && typeof session === 'object') {
      verbose('Using encrypted session');
      // eslint-disable-next-line no-restricted-syntax -- deserialized session data
      storageState = session as BrowserContextOptions['storageState'];
    }
  }

  const files: string[] = [];
  const spin = spinner();

  try {
    // If no color scheme specified, do single capture with browser default
    const schemesToCapture = colorSchemes.length > 0 ? colorSchemes : [undefined];

    for (const colorScheme of schemesToCapture) {
      const suffix = colorSchemes.length > 1 && colorScheme ? `-${colorScheme}` : '';
      const outputPath = suffix ? addSuffix(baseFilename, suffix) : baseFilename;
      const schemeLabel = colorScheme ? ` (${colorScheme})` : '';

      spin.start(`Capturing ${colors.cyan(url)}${schemeLabel}`);

      // Launch browser
      const { browser, context } = await launchBrowser({
        headless: true,
        viewport,
        colorScheme,
        deviceScaleFactor,
        storageState,
      });

      try {
        const page = await context.newPage();

        // Navigate to URL
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

        // Wait for page to stabilize
        await page.waitForTimeout(2000);

        // Ensure output directory exists
        const outputParentDirectory = path.dirname(outputPath);
        if (
          outputParentDirectory &&
          outputParentDirectory !== '.' &&
          !existsSync(outputParentDirectory)
        ) {
          mkdirSync(outputParentDirectory, { recursive: true });
        }

        // Capture screenshot
        const firstSelector = selector?.[0];
        if (firstSelector) {
          // Element screenshot with optional padding
          const element = await page.locator(firstSelector).first().elementHandle();
          if (!element) {
            throw new Error(`Element not found: ${firstSelector}`);
          }

          if (padding > 0) {
            // Get bounding box and expand by padding
            const box = await element.boundingBox();
            if (!box) {
              throw new Error('Could not get element bounding box');
            }

            const clip = {
              x: Math.max(0, box.x - padding),
              y: Math.max(0, box.y - padding),
              width: box.width + padding * 2,
              height: box.height + padding * 2,
            };

            await (format === 'jpeg'
              ? page.screenshot({ path: outputPath, type: 'jpeg', quality: jpegQuality, clip })
              : page.screenshot({ path: outputPath, type: 'png', clip, omitBackground }));
          } else {
            // No padding - screenshot element directly
            await (format === 'jpeg'
              ? element.screenshot({ path: outputPath, type: 'jpeg', quality: jpegQuality })
              : element.screenshot({ path: outputPath, type: 'png', omitBackground }));
          }
        } else {
          // Full page screenshot
          await (format === 'jpeg'
            ? page.screenshot({
                path: outputPath,
                type: 'jpeg',
                quality: jpegQuality,
                fullPage: true,
              })
            : page.screenshot({ path: outputPath, type: 'png', fullPage: true, omitBackground }));
        }

        files.push(outputPath);
        spin.stop(`${colors.green('Saved')} ${colors.dim(outputPath)}`);
      } finally {
        await browser.close();
      }
    }

    if (files.length > 1) {
      outro(`Captured ${files.length} screenshots`);
    }

    return { success: true, files };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    spin.stop(colors.red(`Failed: ${message}`));
    return { success: false, files, error: message };
  }
}
