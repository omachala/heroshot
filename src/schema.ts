/**
 * Zod Schemas
 *
 * All validation schemas for heroshot configuration.
 * Types are inferred and exported from types.ts.
 */

import { z } from 'zod';
import { generateUid } from './utils/generateUid';

/** Viewport preset names */
export type ViewportPreset = 'desktop' | 'tablet' | 'mobile';

/** Viewport preset dimensions */
export const VIEWPORT_PRESETS: Record<ViewportPreset, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

/** Browser viewport settings */
export const viewportSchema = z.object({
  width: z.number().int().positive().default(1280),
  height: z.number().int().positive().default(800),
});

/** Color scheme for light/dark mode (undefined = both, captures two screenshots) */
export const colorSchemeSchema = z.enum(['light', 'dark']);

/** Output format for screenshots */
export const outputFormatSchema = z.enum(['png', 'jpeg']).default('png');

/** Padding around element (can expand capture area) */
export const paddingSchema = z.object({
  top: z.number().int().min(0).default(0),
  right: z.number().int().min(0).default(0),
  bottom: z.number().int().min(0).default(0),
  left: z.number().int().min(0).default(0),
});

/** Scroll position to restore when capturing */
export const scrollPositionSchema = z.object({
  x: z.number().int().min(0).default(0),
  y: z.number().int().min(0).default(0),
});

/**
 * Background fill mode for padding area
 * - 'inherit': show actual page content (default)
 * - 'solid': fill with detected background color
 * - 'transparent': fully transparent (PNG only) - NOT ENABLED YET
 */
export const paddingFillSchema = z.enum(['inherit', 'solid', 'transparent']);

/**
 * Background fill mode for element area
 * - 'original': keep element's actual background (default)
 * - 'solid': replace with detected background color
 * - 'transparent': fully transparent (PNG only) - NOT ENABLED YET
 */
export const elementFillSchema = z.enum(['original', 'solid', 'transparent']);

/** Viewport variant - preset name or custom "WIDTHxHEIGHT" format */
export const viewportVariantSchema = z.string().refine(
  value => {
    // Check if it's a preset
    if (value in VIEWPORT_PRESETS) return true;
    // Check if it's custom format "WIDTHxHEIGHT"
    const match = /^(\d+)x(\d+)$/.exec(value);
    if (!match) return false;
    const width = parseInt(match[1] ?? '0', 10);
    const height = parseInt(match[2] ?? '0', 10);
    return width > 0 && height > 0;
  },
  { message: 'Must be "desktop", "tablet", "mobile", or "WIDTHxHEIGHT" (e.g., "400x500")' }
);

/** Single screenshot definition */
export const screenshotSchema = z.object({
  id: z.string().min(1).default(generateUid),
  name: z.string().min(1),
  url: z.url(),
  selector: z.string().optional(),
  /** Padding to expand capture area beyond element bounds */
  padding: paddingSchema.optional(),
  /** Scroll position to restore when capturing */
  scroll: scrollPositionSchema.optional(),
  /** Background fill mode for padding area */
  paddingFill: paddingFillSchema.optional(),
  /** Background fill mode for element area */
  elementFill: elementFillSchema.optional(),
  /** Viewport variants - generates screenshot for each (e.g., ["desktop", "mobile", "400x500"]) */
  viewports: z.array(viewportVariantSchema).optional(),
  /** Text overrides - selector (relative to main element) -> replacement text */
  textOverrides: z.record(z.string(), z.string()).optional(),
});

/** Browser settings */
export const browserSchema = z.object({
  viewport: viewportSchema.optional(),
  colorScheme: colorSchemeSchema.optional(),
  /** Device scale factor for retina/high-DPI screenshots (1 = standard, 2 = retina) */
  deviceScaleFactor: z.number().min(1).max(3).optional(),
});

/** Shared CLI options for URL capture */
const shotCliOptionsSchema = z.object({
  /** CSS selector(s) to capture - if multiple, captures bounding box of all */
  selector: z.array(z.string()).optional(),
  /** Output filename (auto-generated from URL if not provided) */
  output: z.string().optional(),
  /** Padding around element in pixels */
  padding: z.number().int().min(0).optional(),
  /** Viewport width */
  width: z.number().int().positive().optional(),
  /** Viewport height */
  height: z.number().int().positive().optional(),
  /** Use mobile viewport preset (375x667) */
  mobile: z.boolean().optional(),
  /** Use tablet viewport preset (768x1024) */
  tablet: z.boolean().optional(),
  /** Use desktop viewport preset (1280x800) */
  desktop: z.boolean().optional(),
  /** Force dark color scheme */
  dark: z.boolean().optional(),
  /** Force light color scheme */
  light: z.boolean().optional(),
  /** Device scale factor (1, 2, 3) */
  scale: z.number().min(1).max(3).optional(),
  /** Shortcut for scale=2 */
  retina: z.boolean().optional(),
  /** JPEG quality (1-100) - outputs JPEG instead of PNG */
  quality: z.number().int().min(1).max(100).optional(),
  /** Omit background for transparent PNG */
  omitBackground: z.boolean().optional(),
  /** Capture only viewport instead of full page */
  viewportOnly: z.boolean().optional(),
  /** Timeout in milliseconds */
  timeout: z.number().int().positive().optional(),
});

/** CLI command options for URL capture (includes --save and --clean flags) */
export const shotCommandOptionsSchema = shotCliOptionsSchema.extend({
  /** Save screenshot definition to config file */
  save: z.boolean().optional(),
  /** Delete stale files in output directory */
  clean: z.boolean().optional(),
});

/** Global config */
export const configSchema = z.object({
  /** Output directory for screenshots (relative to config file) */
  outputDirectory: z.string().default('heroshots'),

  /** Output format for screenshots (png or jpeg) */
  outputFormat: outputFormatSchema.optional(),

  /** JPEG quality (1-100), only used when outputFormat is 'jpeg' */
  jpegQuality: z.number().int().min(1).max(100).default(80),

  /** Browser settings (viewport, colorScheme) */
  browser: browserSchema.optional(),

  /** Screenshot definitions */
  screenshots: z.array(screenshotSchema).default([]),
});
