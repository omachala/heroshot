/**
 * Type Definitions
 *
 * All types inferred from Zod schemas in schema.ts.
 */

import type { z } from 'zod';
import type { configSchema, screenshotSchema, viewportSchema } from './schema';

/** Browser viewport dimensions */
export type Viewport = z.infer<typeof viewportSchema>;

/** Single screenshot definition */
export type Screenshot = z.infer<typeof screenshotSchema>;

/** Heroshot configuration */
export type Config = z.infer<typeof configSchema>;
