/**
 * Screenshot sync operations.
 * Main entry point for capturing screenshots based on config definitions.
 */

import { getConfigPath, loadConfig } from '../configFile';
import type { Config, Screenshot } from '../types';
import { error as logError, outro, spinner, verbose, warn } from '../ui';
import { getColorSchemes } from '../utils/getColorSchemes';
import {
  buildBrowserOptions,
  buildCaptureOptions,
  calculateTotalCaptures,
  filterScreenshots,
  resolveOutputDirectory,
} from './configHelpers';
import { buildCaptureJobs, captureParallel } from './parallelCapture';
import { showResults } from './results';
import { captureWithScheme } from './schemeCapture';
import { loadEncryptedSession } from './sessionLoader';
import { handleStaleFiles } from './staleFiles';
import type { CaptureOptions, ScreenshotResult, SyncOptions, SyncResult } from './types';

type CaptureContext = {
  screenshots: Screenshot[];
  outputDirectory: string;
  captureOptions: CaptureOptions;
  browserOptions: {
    viewport: { width: number; height: number };
    deviceScaleFactor?: number;
    storageState: Awaited<ReturnType<typeof loadEncryptedSession>>;
    bypassCSP?: boolean;
    reducedMotion?: 'reduce' | 'no-preference';
    userAgent?: string;
  };
  schemes: ('light' | 'dark')[];
  workers: number;
  captureSpinner: ReturnType<typeof spinner>;
  progress: { captured: number; total: number };
};

/**
 * Execute screenshot capture (parallel or sequential based on workers).
 */
async function executeCapture(context: CaptureContext): Promise<ScreenshotResult[]> {
  const {
    screenshots,
    outputDirectory,
    captureOptions,
    browserOptions,
    schemes,
    workers,
    captureSpinner,
    progress,
  } = context;

  if (workers > 1) {
    const jobs = buildCaptureJobs(screenshots, schemes);
    return captureParallel({
      jobs,
      outputDirectory,
      captureOptions,
      browserOptions,
      workers,
      captureSpinner,
      progress,
    });
  }

  // Sequential capture
  const results: ScreenshotResult[] = [];
  const schemesToCapture = schemes.length === 0 ? [undefined] : schemes;

  for (const colorScheme of schemesToCapture) {
    const schemeResults = await captureWithScheme({
      screenshots,
      outputDirectory,
      captureOptions,
      browserOptions,
      colorScheme,
      schemes,
      captureSpinner,
      progress,
    });
    results.push(...schemeResults);
  }

  return results;
}

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
    ...buildBrowserOptions(config),
    storageState,
  };

  // Start capture
  const captureSpinner = spinner();
  const workers = options.workers ?? config.workers ?? 1;
  const launchMessage = workers > 1 ? `Launching ${workers} workers...` : 'Launching browser...';
  captureSpinner.start(launchMessage);

  let results: ScreenshotResult[];
  try {
    results = await executeCapture({
      screenshots,
      outputDirectory,
      captureOptions,
      browserOptions,
      schemes,
      workers,
      captureSpinner,
      progress: { captured: 0, total: totalToCapture },
    });
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
