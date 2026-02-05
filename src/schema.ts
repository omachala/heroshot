/**
 * Zod Schemas
 *
 * All validation schemas for heroshot configuration.
 * Types are inferred and exported from types.ts.
 */

import { z } from 'zod';
import { actionsSchema } from './actionSchema';
import { generateUid } from './utils/generateUid';

/** Viewport preset names */
export type ViewportPreset = 'desktop' | 'tablet' | 'mobile';

/** Viewport preset dimensions */
export const VIEWPORT_PRESETS: Record<ViewportPreset, { width: number; height: number }> = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 430, height: 932 }, // iPhone 15/16 Pro Max viewport
};

/** Browser viewport settings */
export const viewportSchema = z.object({
  width: z.number().int().positive().default(1280).describe('Browser viewport width in pixels'),
  height: z.number().int().positive().default(800).describe('Browser viewport height in pixels'),
});

/** Color scheme for light/dark mode (undefined = both, captures two screenshots) */
export const colorSchemeSchema = z.enum(['light', 'dark']);

/** Output format for screenshots */
export const outputFormatSchema = z.enum(['png', 'jpeg']).default('png');

/** Padding around element (can expand capture area) */
export const paddingSchema = z.object({
  top: z.number().int().min(0).default(0).describe('Top padding in pixels'),
  right: z.number().int().min(0).default(0).describe('Right padding in pixels'),
  bottom: z.number().int().min(0).default(0).describe('Bottom padding in pixels'),
  left: z.number().int().min(0).default(0).describe('Left padding in pixels'),
});

/**
 * Scroll position saved from editor.
 * NOTE: Currently not used during capture - we use scrollIntoView instead.
 * Kept for potential future use (e.g., precise scroll offset from element).
 */
export const scrollPositionSchema = z.object({
  x: z.number().int().min(0).default(0).describe('Horizontal scroll offset in pixels'),
  y: z.number().int().min(0).default(0).describe('Vertical scroll offset in pixels'),
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
    const width = Number.parseInt(match[1] ?? '0', 10);
    const height = Number.parseInt(match[2] ?? '0', 10);
    return width > 0 && height > 0;
  },
  { message: 'Must be "desktop", "tablet", "mobile", or "WIDTHxHEIGHT" (e.g., "400x500")' }
);

/** Single screenshot definition */
export const screenshotSchema = z.object({
  id: z
    .string()
    .min(1)
    .default(generateUid)
    .describe('Unique identifier (auto-generated if omitted)'),
  name: z.string().min(1).describe('Display name, also used to derive the output filename'),
  url: z.url().describe('Full URL of the page to capture'),
  selector: z
    .string()
    .optional()
    .describe(
      'Element selector for capture (omit for full-page). Supports Playwright selector formats: CSS (.class, #id), shadow DOM (host >> child), XPath (xpath=...), text (text=...), role (role=button[name="OK"]), and chained selectors.'
    ),
  padding: paddingSchema.optional().describe('Expand capture area beyond element bounds'),
  scroll: scrollPositionSchema
    .optional()
    .describe('Saved scroll position (not used during capture - scrollIntoView is used instead)'),
  paddingFill: paddingFillSchema
    .optional()
    .describe(
      'Background fill for padding area: "inherit" (default) shows page content, "solid" fills with detected background color'
    ),
  elementFill: elementFillSchema
    .optional()
    .describe(
      'Background fill for element area: "original" (default) keeps actual background, "solid" replaces with detected color'
    ),
  viewports: z
    .array(viewportVariantSchema)
    .optional()
    .describe(
      'Viewport variants to generate — preset names ("desktop", "tablet", "mobile") or custom "WIDTHxHEIGHT"'
    ),
  textOverrides: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      'Replace text content before capture. Keys are CSS selectors, values are replacement text'
    ),
  actions: actionsSchema.optional(),
});

/** Browser settings */
export const browserSchema = z.object({
  viewport: viewportSchema.optional().describe('Browser viewport dimensions'),
  colorScheme: colorSchemeSchema
    .optional()
    .describe('Color scheme for capture. Omit to capture both light and dark variants'),
  deviceScaleFactor: z
    .number()
    .min(1)
    .max(3)
    .optional()
    .describe('Device pixel ratio (1 = standard, 2 = retina, 3 = ultra-high DPI)'),
  bypassCSP: z
    .boolean()
    .optional()
    .describe(
      'Bypass Content-Security-Policy restrictions. Enabled by default for reliable page.evaluate() calls'
    ),
  reducedMotion: z
    .enum(['reduce', 'no-preference'])
    .optional()
    .describe('Emulate prefers-reduced-motion media feature. Use "reduce" to disable animations'),
  userAgent: z.string().optional().describe('Custom user agent string for the browser'),
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
  /** Use mobile viewport preset (430x932) */
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
  /** Capture only viewport instead of full page */
  viewportOnly: z.boolean().optional(),
  /** Emulate prefers-reduced-motion: reduce */
  reducedMotion: z.boolean().optional(),
  /** Custom user agent string */
  userAgent: z.string().optional(),
});

/** CLI command options for URL capture (includes --save and --clean flags) */
export const shotCommandOptionsSchema = shotCliOptionsSchema.extend({
  /** Save screenshot definition to config file */
  save: z.boolean().optional(),
  /** Delete stale files in output directory */
  clean: z.boolean().optional(),
  /** Number of parallel capture workers */
  workers: z.number().int().min(1).optional(),
  /** Run browser in headed mode (visible window) for debugging */
  headed: z.boolean().optional(),
});

/** Global config */
export const configSchema = z.object({
  outputDirectory: z
    .string()
    .default('heroshots')
    .describe('Output directory for screenshots (relative to config file)'),
  outputFormat: outputFormatSchema.optional().describe('Image format for all screenshots'),
  jpegQuality: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(80)
    .describe('JPEG compression quality (1-100), only used when outputFormat is "jpeg"'),
  browser: browserSchema.optional().describe('Default browser settings applied to all screenshots'),
  workers: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Number of parallel capture workers (default: 1)'),
  screenshots: z.array(screenshotSchema).default([]).describe('Screenshot definitions'),
});
