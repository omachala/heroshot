import { z } from 'zod';

/**
 * Generate a simple random UID (8 chars)
 */
function generateUid(): string {
  // eslint-disable-next-line sonarjs/pseudo-random -- Not used for security, just unique IDs
  return Math.random().toString(36).slice(2, 10);
}

// Browser/viewport settings
const viewportSchema = z.object({
  width: z.number().int().positive().default(1280),
  height: z.number().int().positive().default(800),
});

// Beautification options
const beautifySchema = z.object({
  shadow: z.boolean().default(false),
  radius: z.number().int().nonnegative().default(0),
  background: z.string().default('transparent'),
  padding: z.number().int().nonnegative().default(0),
});

// Color scheme for light/dark mode
const colorSchemeSchema = z.enum(['light', 'dark', 'both']);

// Single screenshot definition
const screenshotSchema = z.object({
  id: z.string().min(1).default(generateUid),
  name: z.string().min(1),
  url: z.url(),
  filename: z.string().min(1),
  selector: z.string().optional(),
  viewport: viewportSchema.optional(),
  waitFor: z.string().optional(),
  delay: z.number().int().nonnegative().optional(),
  colorScheme: colorSchemeSchema.optional(),
  beautify: beautifySchema.partial().optional(),
});

// Browser settings
const browserSchema = z.object({
  viewport: viewportSchema.optional(),
  colorScheme: colorSchemeSchema.optional(),
  cdp: z.url().optional(), // Connect to existing Chrome
});

// Global config
const configSchema = z.object({
  // Output directory for screenshots (relative to config file)
  outputDirectory: z.string().default('.'),

  // Default browser settings
  browser: browserSchema.optional(),

  // Default beautification
  beautify: beautifySchema.partial().optional(),

  // Screenshot definitions
  screenshots: z.array(screenshotSchema).default([]),
});

// Infer types from schemas
export type Viewport = z.infer<typeof viewportSchema>;
export type Beautify = z.infer<typeof beautifySchema>;
export type ColorScheme = z.infer<typeof colorSchemeSchema>;
export type Screenshot = z.infer<typeof screenshotSchema>;
export type Browser = z.infer<typeof browserSchema>;
export type Config = z.infer<typeof configSchema>;

// Export schemas for validation
export const schemas = {
  viewport: viewportSchema,
  beautify: beautifySchema,
  colorScheme: colorSchemeSchema,
  screenshot: screenshotSchema,
  browser: browserSchema,
  config: configSchema,
};

export function parseConfig(input: unknown): Config {
  return configSchema.parse(input);
}

export function validateConfig(
  input: unknown
): { success: true; data: Config } | { success: false; error: z.ZodError } {
  const result = configSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
