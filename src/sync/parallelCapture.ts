/**
 * Parallel screenshot capture with multiple workers.
 */

import pLimit from 'p-limit';
import type { BrowserContextOptions } from 'playwright';
import { launchBrowser } from '../browser/launchBrowser';
import type { Screenshot } from '../types';
import type { spinner } from '../ui';
import { parseViewport } from '../utils/parseViewport';
import { captureAndLog } from './capture';
import type { CaptureOptions, CaptureVariant, ScreenshotResult } from './types';

/** A single capture job representing one screenshot to take */
export type CaptureJob = {
  screenshot: Screenshot;
  colorScheme: 'light' | 'dark' | undefined;
  viewport?: { name: string; width: number; height: number };
  hasMultipleSchemes: boolean;
  hasMultipleViewports: boolean;
};

/** Options for parallel capture */
export type ParallelCaptureOptions = {
  jobs: CaptureJob[];
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
  workers: number;
  captureSpinner: ReturnType<typeof spinner>;
  progress: { captured: number; total: number };
};

/**
 * Build capture jobs from screenshots and schemes.
 * Each job represents a single screenshot capture task.
 */
export function buildCaptureJobs(
  screenshots: Screenshot[],
  schemes: ('light' | 'dark')[]
): CaptureJob[] {
  const jobs: CaptureJob[] = [];
  const hasMultipleSchemes = schemes.length > 1;
  const schemesToCapture = schemes.length === 0 ? [undefined] : schemes;

  for (const screenshot of screenshots) {
    const viewportVariants = screenshot.viewports ?? [];
    const hasMultipleViewports = viewportVariants.length > 1;

    for (const scheme of schemesToCapture) {
      if (viewportVariants.length === 0) {
        // No viewports specified - use default
        jobs.push({
          screenshot,
          colorScheme: scheme,
          hasMultipleSchemes,
          hasMultipleViewports: false,
        });
      } else {
        // Create job for each viewport
        for (const viewportVariant of viewportVariants) {
          const parsedViewport = parseViewport(viewportVariant);
          jobs.push({
            screenshot,
            colorScheme: scheme,
            viewport: parsedViewport,
            hasMultipleSchemes,
            hasMultipleViewports,
          });
        }
      }
    }
  }

  return jobs;
}

/**
 * Execute a batch of capture jobs in a single browser instance.
 */
async function executeBatch(
  jobs: CaptureJob[],
  outputDirectory: string,
  captureOptions: CaptureOptions,
  browserOptions: ParallelCaptureOptions['browserOptions'],
  onProgress: (result: ScreenshotResult) => void
): Promise<ScreenshotResult[]> {
  const results: ScreenshotResult[] = [];

  // Launch browser for this batch
  const { browser, context } = await launchBrowser({
    headless: true,
    viewport: browserOptions.viewport,
    deviceScaleFactor: browserOptions.deviceScaleFactor,
    storageState: browserOptions.storageState,
    bypassCSP: browserOptions.bypassCSP,
    reducedMotion: browserOptions.reducedMotion,
    userAgent: browserOptions.userAgent,
  });

  const page = await context.newPage();

  try {
    for (const job of jobs) {
      const { screenshot, colorScheme, viewport, hasMultipleSchemes, hasMultipleViewports } = job;

      // Set viewport if specified
      if (viewport) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      }

      // Set color scheme
      if (colorScheme) {
        await page.emulateMedia({ colorScheme });
      }

      const variant: CaptureVariant = {
        viewportName: hasMultipleViewports ? viewport?.name : undefined,
        colorScheme: hasMultipleSchemes ? colorScheme : undefined,
      };

      const result = await captureAndLog(
        page,
        screenshot,
        outputDirectory,
        captureOptions,
        variant
      );

      results.push(result);
      onProgress(result);
    }
  } finally {
    await browser.close();
  }

  return results;
}

/**
 * Group jobs by URL to minimize page navigations.
 * Jobs for the same URL are kept together.
 */
export function groupJobsByUrl(jobs: CaptureJob[]): Map<string, CaptureJob[]> {
  const groups = new Map<string, CaptureJob[]>();
  for (const job of jobs) {
    // eslint-disable-next-line prefer-destructuring -- already destructured
    const { url } = job.screenshot;
    const group = groups.get(url) ?? [];
    group.push(job);
    groups.set(url, group);
  }
  return groups;
}

/**
 * Distribute URL groups across workers, keeping same-URL jobs together.
 * Uses a greedy algorithm to balance batch sizes.
 */
export function distributeBatches(
  urlGroups: Map<string, CaptureJob[]>,
  workerCount: number
): CaptureJob[][] {
  // Limit workers to number of URL groups (no point spinning up more)
  const effectiveWorkers = Math.min(workerCount, urlGroups.size);
  const batches: CaptureJob[][] = Array.from({ length: effectiveWorkers }, () => []);
  const batchSizes: number[] = Array.from({ length: effectiveWorkers }, () => 0);

  // Sort URL groups by size (largest first) for better distribution
  const sortedGroups = [...urlGroups.values()];
  sortedGroups.sort((a, b) => b.length - a.length);

  // Assign each URL group to the smallest batch (greedy load balancing)
  for (const group of sortedGroups) {
    const smallestIndex = batchSizes.indexOf(Math.min(...batchSizes));
    // eslint-disable-next-line prefer-destructuring -- array index access
    const batch = batches[smallestIndex];
    if (batch) {
      batch.push(...group);
      batchSizes[smallestIndex] = batch.length;
    }
  }

  return batches;
}

/**
 * Capture screenshots in parallel using multiple workers.
 */
export async function captureParallel(
  options: ParallelCaptureOptions
): Promise<ScreenshotResult[]> {
  const {
    jobs,
    outputDirectory,
    captureOptions,
    browserOptions,
    workers,
    captureSpinner,
    progress,
  } = options;

  // Group jobs by URL to minimize page navigations within each worker
  const urlGroups = groupJobsByUrl(jobs);

  // Distribute URL groups across workers (same-URL jobs stay together)
  const batches = distributeBatches(urlGroups, workers);

  const allResults: ScreenshotResult[] = [];
  const limit = pLimit(workers);

  // Progress callback - thread-safe counter update
  const onProgress = (result: ScreenshotResult): void => {
    progress.captured++;
    captureSpinner.message(`Capturing ${progress.captured}/${progress.total}: ${result.name}`);
  };

  // Execute batches in parallel with concurrency limit
  const batchPromises = batches.map(async batch =>
    limit(async () =>
      executeBatch(batch, outputDirectory, captureOptions, browserOptions, onProgress)
    )
  );

  const batchResults = await Promise.all(batchPromises);

  for (const results of batchResults) {
    allResults.push(...results);
  }

  return allResults;
}
