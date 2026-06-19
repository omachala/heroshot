/**
 * CLI Argument Schemas
 *
 * Zod schemas for command-line options of the URL capture command.
 * Kept separate from the config-file schemas in schema.ts.
 */

import { z } from 'zod';

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
  /** Ignore TLS certificate errors (self-signed certs) */
  ignoreHttpsErrors: z.boolean().optional(),
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
