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
    ...(data.padding && {
      padding: {
        top: Math.round(data.padding.top),
        right: Math.round(data.padding.right),
        bottom: Math.round(data.padding.bottom),
        left: Math.round(data.padding.left),
      },
    }),
    ...(data.scroll && { scroll: data.scroll }),
    ...(data.paddingFill && { paddingFill: data.paddingFill }),
    ...(data.paddingColor && { paddingColor: data.paddingColor }),
    ...(data.elementFill && { elementFill: data.elementFill }),
    ...(data.elementColor && { elementColor: data.elementColor }),
    ...(data.textOverrides &&
      Object.keys(data.textOverrides).length > 0 && { textOverrides: data.textOverrides }),
    ...(data.annotations && data.annotations.length > 0 && { annotations: data.annotations }),
    ...(data.borderWidth && { borderWidth: data.borderWidth }),
    ...(data.borderColor && { borderColor: data.borderColor }),
    ...(data.borderRadius && { borderRadius: data.borderRadius }),
  };
}
