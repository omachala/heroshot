import path from 'node:path';
import type { Screenshot, ShotCommandOptions } from '../types';
import { generateScreenshotFilename } from '../utils/generateScreenshotFilename';
import { generateUid } from '../utils/generateUid';

/**
 * Build a screenshot entry from CLI options.
 * Handles name generation, selector, padding, and viewport variants.
 */
export function buildScreenshotEntry(
  url: string,
  options: ShotCommandOptions | undefined
): Screenshot {
  const selectorValue = options?.selector?.[0];

  // Generate name from --output if provided, otherwise from URL
  // (filename will be derived from name at sync time)
  const outputFile = options?.output;
  const name = outputFile
    ? path.basename(outputFile, path.extname(outputFile))
    : path.basename(generateScreenshotFilename(url, selectorValue), '.png');

  const screenshot: Screenshot = {
    id: generateUid(),
    name,
    url,
    selector: selectorValue,
  };

  // Add padding if specified
  if (options?.padding) {
    screenshot.padding = {
      top: options.padding,
      right: options.padding,
      bottom: options.padding,
      left: options.padding,
    };
  }

  // Add viewport variant if specified
  if (options?.mobile) {
    screenshot.viewports = ['mobile'];
  } else if (options?.tablet) {
    screenshot.viewports = ['tablet'];
  } else if (options?.desktop) {
    screenshot.viewports = ['desktop'];
  }

  return screenshot;
}
