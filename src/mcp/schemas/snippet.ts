/**
 * Snippet tool input schema.
 */

import { z } from 'zod';

export const snippetOptionsSchema = z.object({
  configPath: z
    .string()
    .optional()
    .describe('Path to config file (default: .heroshot/config.json in cwd)'),
  filter: z
    .string()
    .optional()
    .describe('Filter screenshots by id, name, or filename (case-insensitive substring match)'),
  pathPrefix: z
    .string()
    .optional()
    .describe('Custom path prefix for images (default: ./heroshots/)'),
});

export type SnippetOptions = z.infer<typeof snippetOptionsSchema>;
