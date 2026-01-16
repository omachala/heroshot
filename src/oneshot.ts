import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { BrowserContextOptions } from 'playwright';
import { launchBrowser } from './browser';
import { VIEWPORT_PRESETS } from './schema';
import { getSessionKey, loadSession, sessionExists } from './session';
import type { OneshotOptions, OneshotResult } from './types';
import { colors, outro, spinner, verbose } from './ui';
import { addSuffix } from './utils/addSuffix';
import { generateFilename } from './utils/generateFilename';

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
  let viewport = { ...VIEWPORT_PRESETS.desktop };
  if (mobile) {
    viewport = { ...VIEWPORT_PRESETS.mobile };
  } else if (tablet) {
    viewport = { ...VIEWPORT_PRESETS.tablet };
  } else if (desktop) {
    viewport = { ...VIEWPORT_PRESETS.desktop };
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
