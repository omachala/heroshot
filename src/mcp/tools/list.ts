/**
 * List tool handler.
 * Lists screenshots defined in config.
 */

import { getConfigPath, loadConfig } from '../../configFile';
import { filterScreenshots } from '../../sync/configHelpers';
import type { ListOptions } from '../schemas/list';

export type ListResult = {
  success: boolean;
  count: number;
  screenshots: {
    id: string;
    name: string;
    url: string;
    selector?: string;
  }[];
  error?: string;
};

export function listHandler(input: ListOptions): ListResult {
  try {
    const configPath = input.configPath ?? getConfigPath();
    const config = loadConfig(configPath);

    const screenshots = filterScreenshots(config.screenshots, input.filter);

    return {
      success: true,
      count: screenshots.length,
      screenshots: screenshots.map(s => ({
        id: s.id,
        name: s.name,
        url: s.url,
        selector: s.selector,
      })),
    };
  } catch {
    return {
      success: false,
      count: 0,
      screenshots: [],
      error: 'Failed to load config',
    };
  }
}
