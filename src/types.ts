/**
 * Type Definitions
 *
 * All types inferred from Zod schemas in schema.ts.
 */

import type { z } from 'zod';
import type {
  configSchema,
  screenshotSchema,
  shotCommandOptionsSchema,
  viewportSchema,
} from './schema';

/** Browser viewport dimensions */
export type Viewport = z.infer<typeof viewportSchema>;

/** Single screenshot definition */
export type Screenshot = z.infer<typeof screenshotSchema>;

/** Heroshot configuration */
export type Config = z.infer<typeof configSchema>;

/** CLI command options for URL capture */
export type ShotCommandOptions = z.infer<typeof shotCommandOptionsSchema>;

/** Parsed viewport with name for filename suffix */
export type ParsedViewport = {
  name: string;
  width: number;
  height: number;
};
