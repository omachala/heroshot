import type { Screenshot } from '../types';
import type { ScreenshotData } from './types';

/**
 * Convert config screenshots to toolbar ScreenshotData format.
 * Uses index as fallback createdAt for existing items (older items first).
 */
export function configToScreenshotData(screenshots: Screenshot[]): ScreenshotData[] {
  return screenshots.map((screenshot, index) => ({
    id: screenshot.id,
    name: screenshot.name,
    url: screenshot.url,
    selector: screenshot.selector ?? '',
    createdAt: index,
    ...(screenshot.padding && { padding: screenshot.padding }),
    ...(screenshot.scroll && { scroll: screenshot.scroll }),
    ...(screenshot.paddingFill && { paddingFill: screenshot.paddingFill }),
    ...(screenshot.elementFill && { elementFill: screenshot.elementFill }),
    ...(screenshot.textOverrides && { textOverrides: screenshot.textOverrides }),
  }));
}
