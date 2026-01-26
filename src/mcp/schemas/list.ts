/**
 * List tool input schema.
 */

import { z } from 'zod';

export const listOptionsSchema = z.object({
  configPath: z
    .string()
    .optional()
    .describe('Path to config file (default: .heroshot/config.json in cwd)'),
  filter: z
    .string()
    .optional()
    .describe('Filter screenshots by id, name, or filename (case-insensitive substring match)'),
});

export type ListOptions = z.infer<typeof listOptionsSchema>;
