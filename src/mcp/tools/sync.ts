/**
 * Sync tool handler.
 * Captures screenshots defined in config.
 */

import { getConfigPath } from '../../configFile';
import { sync } from '../../sync/sync';
import type { SyncOptions } from '../schemas/sync';

export type SyncResult = {
  success: boolean;
  total: number;
  captured: number;
  failed: number;
  results: {
    id: string;
    name: string;
    filename: string;
    success: boolean;
    error?: string;
  }[];
  staleFiles?: string[];
  deletedFiles?: string[];
  error?: string;
};

function resolveSessionKey(input: { sessionKey?: string }): string | undefined {
  return input.sessionKey ?? process.env['HEROSHOT_SESSION_KEY'];
}

export async function syncHandler(input: SyncOptions): Promise<SyncResult> {
  try {
    const configPath = input.configPath ?? getConfigPath();
    const sessionKey = resolveSessionKey(input);

    const result = await sync({
      configPath,
      filter: input.filter,
      clean: input.clean,
      workers: input.workers,
      sessionKey,
    });

    return {
      success: result.failed === 0,
      total: result.total,
      captured: result.success,
      failed: result.failed,
      results: result.results,
      staleFiles: result.staleFiles,
      deletedFiles: result.deletedFiles,
    };
  } catch (error) {
    return {
      success: false,
      total: 0,
      captured: 0,
      failed: 0,
      results: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
