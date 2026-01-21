/**
 * Screenshot capture functions.
 * Handles taking screenshots of pages and elements.
 */

import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { Page } from 'playwright';
import type { Screenshot } from '../types';
import { verbose } from '../ui';
import { generateScreenshotFilename } from '../utils/screenshotPath';
import { scrollTo } from './browserFunctions';
import { captureElementWithOptions } from './elementCapture';
import { applyColorSchemeClass } from './pageScripts';
import { buildVariantSuffix } from './results';
import { takeScreenshot } from './screenshot';
import type { CaptureOptions, CaptureVariant, ScreenshotResult } from './types';

/**
 * Retry delays in milliseconds (exponential backoff up to 5s).
 */
const RETRY_DELAYS = [500, 1000, 2000, 3000, 5000];

/**
 * Navigate to URL and prepare page for screenshot.
 */
async function navigateAndPrepare(
  page: Page,
  url: string,
  colorScheme?: 'light' | 'dark',
  scroll?: { x: number; y: number }
): Promise<{ success: boolean; error?: string }> {
  // Ensure color scheme is set BEFORE navigation
  if (colorScheme) {
    await page.emulateMedia({ colorScheme });
  }

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to navigate: ${message}` };
  }

  // Apply color scheme class after navigation for JS-based theme detection
  if (colorScheme) {
    await applyColorSchemeClass(page, colorScheme);
  }

  // Wait for page to stabilize
  await page.waitForTimeout(2000);

  // Restore scroll position if saved
  if (scroll) {
    await page.evaluate(scrollTo, { x: scroll.x, y: scroll.y });
    await page.waitForTimeout(100);
  }

  return { success: true };
}

/**
 * Capture page screenshot (full page or viewport).
 */
async function capturePageScreenshot(
  page: Page,
  outputPath: string,
  format: 'png' | 'jpeg',
  quality: number,
  fullPage: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await takeScreenshot({ target: page, outputPath, format, quality, fullPage });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Screenshot failed: ${message}` };
  }
}

/**
 * Capture a single screenshot.
 */
export async function captureScreenshot(
  page: Page,
  screenshot: Screenshot,
  outputDirectory: string,
  captureOptions: CaptureOptions,
  variant: CaptureVariant = {}
): Promise<{ success: boolean; error?: string; filename: string }> {
  const { name, url, selector, padding, scroll, paddingFill, elementFill, textOverrides } =
    screenshot;
  const { format, quality, fullPage } = captureOptions;

  const filename = generateScreenshotFilename({
    name,
    viewport: variant.viewportName,
    colorScheme: variant.colorScheme,
    format,
  });

  const suffix = buildVariantSuffix(variant.viewportName, variant.colorScheme);
  const suffixDisplay = suffix ? ` (${suffix})` : '';
  verbose(`Capturing: ${name}${suffixDisplay}`);

  // Navigate and prepare page
  const navResult = await navigateAndPrepare(page, url, variant.colorScheme, scroll);
  if (!navResult.success) {
    return { ...navResult, filename };
  }

  const outputPath = path.join(outputDirectory, filename);

  // Ensure output directory exists
  const outputDirectoryPath = path.dirname(outputPath);
  if (!existsSync(outputDirectoryPath)) {
    mkdirSync(outputDirectoryPath, { recursive: true });
  }

  // Capture screenshot
  const captureResult = selector
    ? await captureElementWithOptions({
        page,
        selector,
        outputPath,
        format,
        quality,
        padding,
        paddingFill,
        elementFill,
        textOverrides,
      })
    : await capturePageScreenshot(page, outputPath, format, quality, fullPage ?? true);

  return captureResult.success ? { success: true, filename } : { ...captureResult, filename };
}

/**
 * Capture screenshot with retries and logging.
 */
export async function captureAndLog(
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

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    result = await captureScreenshot(page, screenshot, outputDirectory, captureOptions, variant);

    if (result.success) {
      verbose(`Saved: ${result.filename}`);
      break;
    }

    if (attempt < maxRetries - 1) {
      const delay = RETRY_DELAYS[attempt] ?? 1000;
      verbose(
        `Retry ${String(attempt + 1)}/${String(maxRetries)} for ${result.filename} in ${String(delay)}ms...`
      );
      await page.waitForTimeout(delay);
    }
  }

  const suffix = buildVariantSuffix(variant.viewportName, variant.colorScheme);
  const displayName = suffix ? `${screenshot.name} (${suffix})` : screenshot.name;
  const idSuffix = suffix ? `-${suffix}` : '';

  return {
    id: `${screenshot.id}${idSuffix}`,
    name: displayName,
    filename: result.filename,
    success: result.success,
    error: result.error,
  };
}
