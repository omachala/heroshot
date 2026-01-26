/**
 * Sync tool input schema.
 */

import { z } from 'zod';

export const syncOptionsSchema = z.object({
  configPath: z
    .string()
    .optional()
    .describe('Path to config file (default: .heroshot/config.json in cwd)'),
  filter: z
    .string()
    .optional()
    .describe('Filter screenshots by id, name, or filename (case-insensitive substring match)'),
  clean: z.boolean().optional().describe('Delete stale files in output directory'),
  workers: z.number().int().min(1).optional().describe('Number of parallel capture workers'),
  sessionKey: z.string().optional().describe('Encrypted session key for authenticated screenshots'),
});

export type SyncOptions = z.infer<typeof syncOptionsSchema>;
