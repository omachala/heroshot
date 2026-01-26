/**
 * Add tool input schema.
 * Wraps the existing screenshotSchema from heroshot.
 */

import { z } from 'zod';
import { screenshotSchema } from '../../schema';

// Screenshot definition without id (auto-generated)
const screenshotInputSchema = screenshotSchema.omit({ id: true });

export const addOptionsSchema = z.object({
  configPath: z
    .string()
    .optional()
    .describe('Path to config file (default: .heroshot/config.json in cwd)'),
  screenshot: screenshotInputSchema.describe('Screenshot definition to add'),
});

export type AddOptions = z.infer<typeof addOptionsSchema>;
