import { VIEWPORT_PRESETS } from '../schema';
import type { ParsedViewport } from '../types';

/**
 * Parse viewport variant string to dimensions
 * Supports: "desktop", "tablet", "mobile", or "WIDTHxHEIGHT"
 */
export function parseViewport(variant: string): ParsedViewport {
  // Check presets first
  if (variant === 'desktop') {
    return { name: 'desktop', ...VIEWPORT_PRESETS.desktop };
  }
  if (variant === 'tablet') {
    return { name: 'tablet', ...VIEWPORT_PRESETS.tablet };
  }
  if (variant === 'mobile') {
    return { name: 'mobile', ...VIEWPORT_PRESETS.mobile };
  }

  // Parse custom format "WIDTHxHEIGHT"
  const match = /^(\d+)x(\d+)$/.exec(variant);
  if (match) {
    const [, widthValue, heightValue] = match;
    if (widthValue && heightValue) {
      const width = parseInt(widthValue, 10);
      const height = parseInt(heightValue, 10);
      return { name: variant, width, height };
    }
  }

  // Fallback to desktop (shouldn't happen with schema validation)
  return { name: 'desktop', ...VIEWPORT_PRESETS.desktop };
}
