/**
 * Result display and summary utilities for sync operations.
 */

import path from 'node:path';
import { colors, log, error as logError, verbose as logVerbose, outro, warn } from '../ui';
import type { ScreenshotResult, SyncResult } from './types';

/**
 * Build a display name with variant info.
 */
export function buildDisplayName(
  name: string,
  viewportName?: string,
  colorScheme?: string,
  locale?: string
): string {
  const suffix = [locale, viewportName, colorScheme].filter(Boolean).join('-');
  return suffix ? `${name} (${suffix})` : name;
}

/**
 * Build a variant ID suffix.
 */
export function buildVariantSuffix(
  viewportName?: string,
  colorScheme?: string,
  locale?: string
): string {
  return [locale, viewportName, colorScheme].filter(Boolean).join('-');
}

/**
 * Show capture results and return summary.
 */
export function showResults(
  results: ScreenshotResult[],
  outputDirectory: string,
  staleFiles: string[],
  deletedFiles: string[]
): SyncResult {
  const { length: totalCount } = results;
  const successfulResults = results.filter(({ success }) => success);
  const { length: successCount } = successfulResults;
  const failedCount = totalCount - successCount;

  // Log errors for failed captures
  if (failedCount > 0) {
    for (const result of results) {
      if (!result.success) {
        logError(`${result.name}: ${result.error ?? 'Unknown error'}`);
      }
    }
  }

  // Build summary parts
  const parts: string[] = [];

  if (failedCount > 0) {
    parts.push(colors.red(`${failedCount} failed`));
  }

  parts.push(`${successCount} saved`);

  if (deletedFiles.length > 0) {
    parts.push(colors.yellow(`${deletedFiles.length} deleted`));
  } else if (staleFiles.length > 0) {
    parts.push(colors.dim(`${staleFiles.length} stale`));
  }

  outro(parts.join(', '));

  // Print full paths for each saved file (clickable in terminal)
  for (const result of successfulResults) {
    const fullPath = path.join(outputDirectory, result.filename);
    log(`  ${colors.dim(fullPath)}`);
  }

  // Log stale file hint if any (and not deleted)
  if (staleFiles.length > 0 && deletedFiles.length === 0) {
    warn(`Stale files found: ${staleFiles.join(', ')}`);
    logVerbose('Run with --clean to delete stale files');
  }

  return {
    total: totalCount,
    success: successCount,
    failed: failedCount,
    results,
    staleFiles: staleFiles.length > 0 ? staleFiles : undefined,
    deletedFiles: deletedFiles.length > 0 ? deletedFiles : undefined,
  };
}
