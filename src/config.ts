/**
 * Config Parsing
 *
 * Validates and parses heroshot configuration.
 */

import { configSchema } from './schema';
import type { Config } from './types';

export function parseConfig(input: unknown): Config {
  return configSchema.parse(input);
}
