/**
 * File system utilities for sync operations.
 */

import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { verbose } from '../ui';

/**
 * Get list of existing screenshot files in output directory.
 * Scans recursively to support subdirectory output paths.
 * Returns relative paths (e.g., "registry/login-01-light.png").
 */
export function getExistingFiles(outputDirectory: string): string[] {
  if (!existsSync(outputDirectory)) {
    return [];
  }
  try {
    return readdirSync(outputDirectory, { recursive: true })
      .map(file => (typeof file === 'string' ? file : file.toString()))
      .filter(file => file.endsWith('.png') || file.endsWith('.jpg'));
  } catch {
    return [];
  }
}

/**
 * Delete stale files from output directory.
 * Returns list of successfully deleted files.
 */
export function deleteStaleFiles(outputDirectory: string, staleFiles: string[]): string[] {
  const deleted: string[] = [];
  for (const file of staleFiles) {
    try {
      unlinkSync(path.join(outputDirectory, file));
      deleted.push(file);
      verbose(`Deleted stale: ${file}`);
    } catch {
      // Ignore deletion errors
    }
  }
  return deleted;
}

/**
 * Find stale files (files that exist but weren't written).
 */
export function findStaleFiles(existingFiles: string[], writtenFiles: Set<string>): string[] {
  return existingFiles.filter(file => !writtenFiles.has(file));
}
