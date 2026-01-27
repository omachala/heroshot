/**
 * Visual regression testing utilities using pixelmatch
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const BASELINES_DIR = path.join(import.meta.dirname, 'baselines');
const DIFFS_DIR = path.join(import.meta.dirname, 'diffs');

/** Threshold for pixel difference (0-1, lower = stricter) */
const THRESHOLD = 0.1;

/** Maximum allowed different pixels (absolute) */
const MAX_DIFF_PIXELS = 50;

export type CompareResult = {
  match: boolean;
  diffPixels: number;
  diffPath?: string;
  baselinePath: string;
  isNewBaseline: boolean;
};

/**
 * Compare a screenshot against its baseline.
 * If no baseline exists, creates one and returns match: true.
 */
export function compareToBaseline(actualPath: string, baselineName: string): CompareResult {
  const baselinePath = path.join(BASELINES_DIR, `${baselineName}.png`);

  // Ensure directories exist
  if (!existsSync(BASELINES_DIR)) {
    mkdirSync(BASELINES_DIR, { recursive: true });
  }

  // If no baseline, create it
  if (!existsSync(baselinePath)) {
    const actualData = readFileSync(actualPath);
    writeFileSync(baselinePath, actualData);
    return {
      match: true,
      diffPixels: 0,
      baselinePath,
      isNewBaseline: true,
    };
  }

  // Load images
  const actual = PNG.sync.read(readFileSync(actualPath));
  const baseline = PNG.sync.read(readFileSync(baselinePath));

  // Check dimensions match
  if (actual.width !== baseline.width || actual.height !== baseline.height) {
    return {
      match: false,
      diffPixels: -1, // -1 indicates dimension mismatch
      baselinePath,
      isNewBaseline: false,
    };
  }

  // Create diff image
  const diff = new PNG({ width: actual.width, height: actual.height });

  // Compare
  const diffPixels = pixelmatch(
    actual.data,
    baseline.data,
    diff.data,
    actual.width,
    actual.height,
    { threshold: THRESHOLD }
  );

  const match = diffPixels <= MAX_DIFF_PIXELS;

  // Save diff if there are differences
  let diffPath: string | undefined;
  if (!match) {
    if (!existsSync(DIFFS_DIR)) {
      mkdirSync(DIFFS_DIR, { recursive: true });
    }
    diffPath = path.join(DIFFS_DIR, `${baselineName}-diff.png`);
    writeFileSync(diffPath, PNG.sync.write(diff));
  }

  return {
    match,
    diffPixels,
    diffPath,
    baselinePath,
    isNewBaseline: false,
  };
}
