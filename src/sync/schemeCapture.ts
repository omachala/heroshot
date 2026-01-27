/**
 * Color scheme-based screenshot capture orchestration.
 */

import type { BrowserContextOptions } from 'playwright';
import { launchBrowser } from '../browser/launchBrowser';
import type { Screenshot } from '../types';
import type { spinner } from '../ui';
import { parseViewport } from '../utils/parseViewport';
import { captureAndLog } from './capture';
import type { CaptureOptions, CaptureVariant, ScreenshotResult } from './types';

/** Options for capturing with a specific color scheme */
export type CaptureSchemeOptions = {
  screenshots: Screenshot[];
  outputDirectory: string;
  captureOptions: CaptureOptions;
  browserOptions: {
    viewport: { width: number; height: number };
    deviceScaleFactor?: number;
    storageState?: BrowserContextOptions['storageState'];
    bypassCSP?: boolean;
    reducedMotion?: 'reduce' | 'no-preference';
    userAgent?: string;
  };
  colorScheme: 'light' | 'dark' | undefined;
  schemes: ('light' | 'dark')[];
  captureSpinner: ReturnType<typeof spinner>;
  progress: { captured: number; total: number };
};

/**
 * Capture screenshots for a single color scheme.
 * Launches a browser, captures all screenshots, and closes the browser.
 */
export async function captureWithScheme(
  options: CaptureSchemeOptions
): Promise<ScreenshotResult[]> {
  const {
    screenshots,
    outputDirectory,
    captureOptions,
    browserOptions,
    colorScheme,
    schemes,
    captureSpinner,
    progress,
  } = options;
  const results: ScreenshotResult[] = [];

  const { browser, context } = await launchBrowser({
    headless: true,
    viewport: browserOptions.viewport,
    deviceScaleFactor: browserOptions.deviceScaleFactor,
    storageState: browserOptions.storageState,
    colorScheme,
    bypassCSP: browserOptions.bypassCSP,
    reducedMotion: browserOptions.reducedMotion,
    userAgent: browserOptions.userAgent,
  });

  const page = await context.newPage();

  if (colorScheme) {
    await page.emulateMedia({ colorScheme });
  }

  const hasMultipleSchemes = schemes.length > 1;

  for (const screenshot of screenshots) {
    const viewportVariants = screenshot.viewports ?? [];
    const hasMultipleViewports = viewportVariants.length > 1;

    if (viewportVariants.length === 0) {
      // No viewports specified - use default viewport
      progress.captured++;
      const variant: CaptureVariant = {
        colorScheme: hasMultipleSchemes ? colorScheme : undefined,
      };
      const suffix = variant.colorScheme ? ` (${variant.colorScheme})` : '';
      captureSpinner.message(
        `Capturing ${progress.captured}/${progress.total}: ${screenshot.name}${suffix}`
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

        await page.setViewportSize({
          width: parsedViewport.width,
          height: parsedViewport.height,
        });

        progress.captured++;
        const variant: CaptureVariant = {
          viewportName: hasMultipleViewports ? parsedViewport.name : undefined,
          colorScheme: hasMultipleSchemes ? colorScheme : undefined,
        };
        const suffix = [variant.viewportName, variant.colorScheme].filter(Boolean).join(', ');
        const suffixDisplay = suffix ? ` (${suffix})` : '';

        captureSpinner.message(
          `Capturing ${progress.captured}/${progress.total}: ${screenshot.name}${suffixDisplay}`
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
  return results;
}
