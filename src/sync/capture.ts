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
import {
  applyColorSchemeClass,
  applyElementBackground,
  applyTextOverrides,
  findElement,
  getElementBackgroundColor,
  injectPaddingMask,
  removePaddingMask,
  restoreElementBackground,
} from './pageScripts';
import { buildVariantSuffix } from './results';
import type {
  CaptureOptions,
  CaptureVariant,
  ElementCaptureOptions,
  ScreenshotResult,
  TakeScreenshotOptions,
} from './types';

/**
 * Retry delays in milliseconds (exponential backoff up to 5s).
 */
const RETRY_DELAYS = [500, 1000, 2000, 3000, 5000];

/**
 * Take a screenshot with the given options.
 */
export async function takeScreenshot(options: TakeScreenshotOptions): Promise<void> {
  const { target, outputPath, format, quality, clip, omitBackground, fullPage = true } = options;
  const isPage = 'goto' in target;

  if (format === 'jpeg') {
    if (isPage && clip) {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality, clip });
    } else if (isPage) {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality, fullPage });
    } else {
      await target.screenshot({ path: outputPath, type: 'jpeg', quality });
    }
  } else if (isPage && clip) {
    await target.screenshot({ path: outputPath, type: 'png', clip, omitBackground });
  } else if (isPage) {
    await target.screenshot({ path: outputPath, type: 'png', fullPage, omitBackground });
  } else {
    await target.screenshot({ path: outputPath, type: 'png', omitBackground });
  }
}

/**
 * Capture element screenshot with optional padding and background fill modes.
 */
export async function captureElementScreenshot(
  options: ElementCaptureOptions
): Promise<{ success: boolean; error?: string }> {
  const {
    page,
    element,
    selector,
    outputPath,
    format,
    quality,
    padding,
    paddingFill,
    elementFill,
  } = options;
  const hasPadding =
    padding && (padding.top > 0 || padding.right > 0 || padding.bottom > 0 || padding.left > 0);

  const needsTransparent =
    format === 'png' && (paddingFill === 'transparent' || elementFill === 'transparent');

  const needsBgColor = paddingFill === 'solid' || elementFill === 'solid';
  let bgColor = '#ffffff';
  if (needsBgColor) {
    bgColor = await getElementBackgroundColor(page, selector);
  }

  if (elementFill === 'solid') {
    await applyElementBackground(page, selector, bgColor);
  } else if (elementFill === 'transparent') {
    await applyElementBackground(page, selector, 'transparent');
  }

  if (hasPadding && padding) {
    const box = await element.boundingBox();
    if (!box) {
      return { success: false, error: 'Could not get element bounding box' };
    }

    if (paddingFill === 'solid') {
      await injectPaddingMask(page, element, padding, bgColor);
    }

    const clip = {
      x: Math.max(0, box.x - padding.left),
      y: Math.max(0, box.y - padding.top),
      width: box.width + padding.left + padding.right,
      height: box.height + padding.top + padding.bottom,
    };

    await takeScreenshot({
      target: page,
      outputPath,
      format,
      quality,
      clip,
      omitBackground: needsTransparent,
    });

    if (paddingFill === 'solid') {
      await removePaddingMask(page);
    }
  } else {
    await takeScreenshot({
      target: element,
      outputPath,
      format,
      quality,
      omitBackground: needsTransparent,
    });
  }

  if (elementFill === 'solid' || elementFill === 'transparent') {
    await restoreElementBackground(page, selector);
  }

  return { success: true };
}

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
    await page.evaluate(`window.scrollTo(${scroll.x}, ${scroll.y})`);
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

/** Options for capturing an element */
type CaptureElementOptions = {
  page: Page;
  selector: string;
  outputPath: string;
  format: 'png' | 'jpeg';
  quality: number;
  padding?: { top: number; right: number; bottom: number; left: number };
  paddingFill?: 'inherit' | 'solid' | 'transparent';
  elementFill?: 'original' | 'solid' | 'transparent';
  textOverrides?: Record<string, string>;
};

/**
 * Capture element with selector and optional text overrides.
 */
async function captureElementWithOptions(
  options: CaptureElementOptions
): Promise<{ success: boolean; error?: string }> {
  const {
    page,
    selector,
    outputPath,
    format,
    quality,
    padding,
    paddingFill,
    elementFill,
    textOverrides,
  } = options;

  const element = await findElement(page, selector);
  if (!element) {
    return { success: false, error: `Element not found: ${selector}` };
  }

  if (textOverrides && Object.keys(textOverrides).length > 0) {
    await applyTextOverrides(page, selector, textOverrides);
  }

  return captureElementScreenshot({
    page,
    element,
    selector,
    outputPath,
    format,
    quality,
    padding,
    paddingFill,
    elementFill,
  });
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
  verbose(`Capturing: ${name}${suffix ? ` (${suffix})` : ''}`);

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

  return {
    id: `${screenshot.id}${suffix ? `-${suffix}` : ''}`,
    name: displayName,
    filename: result.filename,
    success: result.success,
    error: result.error,
  };
}
