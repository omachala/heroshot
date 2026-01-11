/**
 * Zod Schemas
 *
 * All validation schemas for heroshot configuration.
 * Types are inferred and exported from types.ts.
 */

import { z } from 'zod';

/**
 * Generate a simple random UID (8 chars)
 */
function generateUid(): string {
  // eslint-disable-next-line sonarjs/pseudo-random -- Not used for security, just unique IDs
  return Math.random().toString(36).slice(2, 10);
}

/** Browser viewport settings */
export const viewportSchema = z.object({
  width: z.number().int().positive().default(1280),
  height: z.number().int().positive().default(800),
});

/** Color scheme for light/dark mode ('both' captures two screenshots) */
export const colorSchemeSchema = z.enum(['light', 'dark', 'both']);

/** Output format for screenshots */
export const outputFormatSchema = z.enum(['png', 'jpeg']).default('png');

/** Single screenshot definition */
export const screenshotSchema = z.object({
  id: z.string().min(1).default(generateUid),
  name: z.string().min(1),
  url: z.url(),
  filename: z.string().min(1),
  selector: z.string().optional(),
});

/** Browser settings */
export const browserSchema = z.object({
  viewport: viewportSchema.optional(),
  colorScheme: colorSchemeSchema.optional(),
});

/** Global config */
export const configSchema = z.object({
  /** Output directory for screenshots (relative to config file) */
  outputDirectory: z.string().default('.'),

  /** Output format for screenshots (png or jpeg) */
  outputFormat: outputFormatSchema.optional(),

  /** JPEG quality (1-100), only used when outputFormat is 'jpeg' */
  jpegQuality: z.number().int().min(1).max(100).default(80),

  /** Browser settings (viewport, colorScheme) */
  browser: browserSchema.optional(),

  /** Screenshot definitions */
  screenshots: z.array(screenshotSchema).default([]),
});
