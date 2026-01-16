/**
 * Type Definitions
 *
 * All types inferred from Zod schemas in schema.ts.
 */

import type { z } from 'zod';
import type {
  configSchema,
  oneshotCommandOptionsSchema,
  oneshotOptionsSchema,
  oneshotResultSchema,
  screenshotSchema,
  viewportSchema,
} from './schema';

/** Browser viewport dimensions */
export type Viewport = z.infer<typeof viewportSchema>;

/** Single screenshot definition */
export type Screenshot = z.infer<typeof screenshotSchema>;

/** Heroshot configuration */
export type Config = z.infer<typeof configSchema>;

/** CLI command options for oneshot mode */
export type OneshotCommandOptions = z.infer<typeof oneshotCommandOptionsSchema>;

/** Full oneshot options (CLI + runtime values) */
export type OneshotOptions = z.infer<typeof oneshotOptionsSchema>;

/** Oneshot capture result */
export type OneshotResult = z.infer<typeof oneshotResultSchema>;

/** Parsed viewport with name for filename suffix */
export type ParsedViewport = {
  name: string;
  width: number;
  height: number;
};
