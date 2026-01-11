import { z } from 'zod';

/**
 * Generate a simple random UID (8 chars)
 */
function generateUid(): string {
  // eslint-disable-next-line sonarjs/pseudo-random -- Not used for security, just unique IDs
  return Math.random().toString(36).slice(2, 10);
}

// Browser viewport settings
const viewportSchema = z.object({
  width: z.number().int().positive().default(1280),
  height: z.number().int().positive().default(800),
});

// Color scheme for light/dark mode ('both' captures two screenshots)
const colorSchemeSchema = z.enum(['light', 'dark', 'both']);

// Single screenshot definition
const screenshotSchema = z.object({
  id: z.string().min(1).default(generateUid),
  name: z.string().min(1),
  url: z.url(),
  filename: z.string().min(1),
  selector: z.string().optional(),
});

// Browser settings
const browserSchema = z.object({
  viewport: viewportSchema.optional(),
  colorScheme: colorSchemeSchema.optional(),
});

// Global config
const configSchema = z.object({
  // Output directory for screenshots (relative to config file)
  outputDirectory: z.string().default('.'),

  // Browser settings (viewport, colorScheme)
  browser: browserSchema.optional(),

  // Screenshot definitions
  screenshots: z.array(screenshotSchema).default([]),
});

// Infer types from schemas
export type Viewport = z.infer<typeof viewportSchema>;
export type ColorScheme = z.infer<typeof colorSchemeSchema>;
export type Screenshot = z.infer<typeof screenshotSchema>;
export type Browser = z.infer<typeof browserSchema>;
export type Config = z.infer<typeof configSchema>;

export function parseConfig(input: unknown): Config {
  return configSchema.parse(input);
}
