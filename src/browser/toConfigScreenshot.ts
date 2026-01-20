import type { Screenshot } from '../types';
import type { ScreenshotData } from './types';

/**
 * Convert ScreenshotData to Screenshot for config.
 * Filename is derived from name at sync time - not stored in config.
 */
export function toConfigScreenshot(data: ScreenshotData): Screenshot {
  return {
    id: data.id,
    name: data.name,
    url: data.url,
    selector: data.selector,
    ...(data.padding && { padding: data.padding }),
    ...(data.scroll && { scroll: data.scroll }),
    ...(data.paddingFill && { paddingFill: data.paddingFill }),
    ...(data.elementFill && { elementFill: data.elementFill }),
    ...(data.textOverrides &&
      Object.keys(data.textOverrides).length > 0 && { textOverrides: data.textOverrides }),
  };
}
