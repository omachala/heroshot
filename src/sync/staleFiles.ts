/**
 * Stale file detection and cleanup utilities.
 */

import { deleteStaleFiles, findStaleFiles, getExistingFiles } from './files';
import type { ScreenshotResult } from './types';

/** Options for stale file handling */
type StaleFileOptions = {
  /** Pattern filter - skip stale detection if filter is active */
  filter?: string;
  /** Skip stale file detection entirely */
  skipStaleCheck?: boolean;
  /** Delete stale files instead of just reporting */
  clean?: boolean;
};

/** Result of stale file handling */
type StaleFileResult = {
  stale: string[];
  deleted: string[];
};

/**
 * Handle stale file detection and cleanup.
 * Returns empty arrays if filter is active or stale check is skipped.
 */
export function handleStaleFiles(
  outputDirectory: string,
  results: ScreenshotResult[],
  options: StaleFileOptions
): StaleFileResult {
  if (options.filter || options.skipStaleCheck) {
    return { stale: [], deleted: [] };
  }

  const existingFiles = getExistingFiles(outputDirectory);
  const writtenFiles = new Set(
    results.filter(({ success }) => success).map(({ filename }) => filename)
  );
  const stale = findStaleFiles(existingFiles, writtenFiles);

  let deleted: string[] = [];
  if (options.clean && stale.length > 0) {
    deleted = deleteStaleFiles(outputDirectory, stale);
  }

  return { stale, deleted };
}
