/**
 * Screenshot sync operations.
 * Main entry point for capturing screenshots based on config definitions.
 */

import { getConfigPath, loadConfig } from '../configFile';
import type { Config } from '../types';
import { error as logError, outro, spinner, verbose, warn } from '../ui';
import { getColorSchemes } from '../utils/getColorSchemes';
import {
  buildCaptureOptions,
  calculateTotalCaptures,
  filterScreenshots,
  resolveOutputDirectory,
} from './configHelpers';
import { showResults } from './results';
import { captureWithScheme } from './schemeCapture';
import { loadEncryptedSession } from './sessionLoader';
import { handleStaleFiles } from './staleFiles';
import type { ScreenshotResult, SyncOptions, SyncResult } from './types';

/**
 * Sync all screenshots defined in config.
 */
export async function sync(options: SyncOptions = {}): Promise<SyncResult> {
  // Load config
  const configPath = options.configPath ?? getConfigPath();
  const config: Config = options.config ?? loadConfig(configPath);

  if (config.screenshots.length === 0) {
    warn('No screenshots defined.');
    outro('Run "heroshot config" to add screenshots');
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  // Filter screenshots
  const screenshots = filterScreenshots(config.screenshots, options.filter);

  if (options.filter && screenshots.length === 0) {
    logError(`No screenshots matching: ${options.filter}`);
    return { total: 0, success: 0, failed: 0, results: [] };
  }

  if (options.filter && screenshots.length > 0) {
    const names = screenshots.map(({ name }) => name).join(', ');
    verbose(`Matched ${screenshots.length}: ${names}`);
  }

  // Resolve paths and options
  const outputDirectory = resolveOutputDirectory(
    configPath,
    config.outputDirectory,
    options.outputDirectory
  );
  const storageState = loadEncryptedSession(options.sessionKey);
  const schemes = getColorSchemes(config.browser?.colorScheme);
  const captureOptions = buildCaptureOptions(config, options.viewportOnly);
  const totalToCapture = calculateTotalCaptures(screenshots, schemes.length);

  // Browser options
  const browserOptions = {
    viewport: config.browser?.viewport ?? { width: 1280, height: 800 },
    deviceScaleFactor: config.browser?.deviceScaleFactor,
    storageState,
  };

  // Start capture
  const captureSpinner = spinner();
  captureSpinner.start('Launching browser...');

  const results: ScreenshotResult[] = [];
  const progress = { captured: 0, total: totalToCapture };

  try {
    if (schemes.length === 0) {
      // No color scheme specified - capture once with browser default
      const schemeResults = await captureWithScheme({
        screenshots,
        outputDirectory,
        captureOptions,
        browserOptions,
        colorScheme: undefined,
        schemes,
        captureSpinner,
        progress,
      });
      results.push(...schemeResults);
    } else {
      // Capture for each color scheme
      for (const scheme of schemes) {
        const schemeResults = await captureWithScheme({
          screenshots,
          outputDirectory,
          captureOptions,
          browserOptions,
          colorScheme: scheme,
          schemes,
          captureSpinner,
          progress,
        });
        results.push(...schemeResults);
      }
    }

    captureSpinner.stop('Screenshots captured');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    captureSpinner.stop(`Failed: ${message}`);
    logError(message);
    return { total: totalToCapture, success: 0, failed: totalToCapture, results: [] };
  }

  // Handle stale files
  const { stale: staleFiles, deleted: deletedFiles } = handleStaleFiles(outputDirectory, results, {
    filter: options.filter,
    skipStaleCheck: options.skipStaleCheck,
    clean: options.clean,
  });

  return showResults(results, outputDirectory, staleFiles, deletedFiles);
}
