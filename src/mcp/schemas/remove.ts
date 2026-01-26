/**
 * Remove tool input schema.
 */

import { z } from 'zod';

export const removeOptionsSchema = z.object({
  configPath: z
    .string()
    .optional()
    .describe('Path to config file (default: .heroshot/config.json in cwd)'),
  id: z.string().min(1).describe('ID of the screenshot to remove'),
});

export type RemoveOptions = z.infer<typeof removeOptionsSchema>;
