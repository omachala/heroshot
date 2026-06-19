/**
 * Color scheme + locale screenshot capture orchestration.
 */

import { launchBrowser } from '../browser/launchBrowser';
import type { Screenshot } from '../types';
import type { spinner } from '../ui';
import { applyLocale } from '../utils/localeUrl';
import { parseViewport } from '../utils/parseViewport';
import { captureAndLog } from './capture';
import type {
  BrowserCaptureOptions,
  CaptureOptions,
  CaptureVariant,
  ScreenshotResult,
} from './types';

/** Options for capturing with a specific color scheme and locale */
export type CaptureSchemeOptions = {
  screenshots: Screenshot[];
  outputDirectory: string;
  captureOptions: CaptureOptions;
  browserOptions: BrowserCaptureOptions;
  colorScheme: 'light' | 'dark' | undefined;
  schemes: ('light' | 'dark')[];
  /** Current locale code (e.g. "de"). Browser locale + Accept-Language are set for all locales. */
  locale: string | undefined;
  /** All configured locales — used to determine whether to add locale to filename */
  locales: string[];
  captureSpinner: ReturnType<typeof spinner>;
  progress: { captured: number; total: number };
};

/**
 * Capture screenshots for a single color scheme + locale combination.
 * Launches a browser, captures all screenshots, and closes the browser.
 *
 * Locale is a browser context-level setting in Playwright, so each locale
 * gets its own browser launch. This ensures Accept-Language and JS locale APIs
 * (Intl, navigator.language) reflect the correct locale for all pages captured.
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
    locale,
    locales,
    captureSpinner,
    progress,
  } = options;
  const results: ScreenshotResult[] = [];

  const { browser, context } = await launchBrowser({
    headless: !browserOptions.headed,
    viewport: browserOptions.viewport,
    deviceScaleFactor: browserOptions.deviceScaleFactor,
    storageState: browserOptions.storageState,
    colorScheme,
    bypassCSP: browserOptions.bypassCSP,
    reducedMotion: browserOptions.reducedMotion,
    userAgent: browserOptions.userAgent,
    ignoreHTTPSErrors: browserOptions.ignoreHTTPSErrors,
    locale,
  });

  const page = await context.newPage();

  if (colorScheme) {
    await page.emulateMedia({ colorScheme });
  }

  const hasMultipleSchemes = schemes.length > 1;
  const hasMultipleLocales = locales.length > 1;

  for (const screenshot of screenshots) {
    const viewportVariants = screenshot.viewports ?? [];
    const hasMultipleViewports = viewportVariants.length > 1;

    // Resolve locale-transformed URL (replaces {locale} placeholder if present)
    const localeUrl =
      locale && screenshot.url.includes('{locale}')
        ? applyLocale(screenshot.url, locale)
        : undefined;

    if (viewportVariants.length === 0) {
      // No viewports specified - use default viewport
      progress.captured++;
      const variant: CaptureVariant = {
        colorScheme: hasMultipleSchemes ? colorScheme : undefined,
        locale: hasMultipleLocales ? locale : undefined,
        localeUrl,
      };
      const suffix = [variant.locale, variant.colorScheme].filter(Boolean).join(', ');
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
      continue;
    }

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
        locale: hasMultipleLocales ? locale : undefined,
        localeUrl,
      };
      const suffix = [variant.locale, variant.viewportName, variant.colorScheme]
        .filter(Boolean)
        .join(', ');
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

  await browser.close();
  return results;
}
