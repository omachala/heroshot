/**
 * Remove tool handler.
 * Removes a screenshot definition from config.
 */

import { getConfigPath, loadConfig, saveConfig } from '../../configFile';
import type { RemoveOptions } from '../schemas/remove';

export type RemoveResult = {
  success: boolean;
  removed?: {
    id: string;
    name: string;
  };
  error?: string;
};

export function removeHandler(input: RemoveOptions): RemoveResult {
  try {
    const configPath = input.configPath ?? getConfigPath();
    const config = loadConfig(configPath);

    const index = config.screenshots.findIndex(s => s.id === input.id);

    if (index === -1) {
      return {
        success: false,
        error: `Screenshot with id "${input.id}" not found`,
      };
    }

    const [removed] = config.screenshots.splice(index, 1);
    if (!removed) {
      return {
        success: false,
        error: `Screenshot with id "${input.id}" not found`,
      };
    }

    saveConfig(configPath, config);

    return {
      success: true,
      removed: {
        id: removed.id,
        name: removed.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
