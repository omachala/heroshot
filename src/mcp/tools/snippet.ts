/**
 * Snippet tool handler.
 * Generates markdown/HTML snippets for screenshots.
 */

import { generateSnippets } from '../../cli/snippet';
import { getConfigPath, loadConfig } from '../../configFile';
import type { SnippetOptions } from '../schemas/snippet';

export type SnippetResult = {
  success: boolean;
  count: number;
  snippets: {
    id: string;
    name: string;
    snippet: string;
  }[];
  error?: string;
};

export function snippetHandler(input: SnippetOptions): SnippetResult {
  try {
    const configPath = input.configPath ?? getConfigPath();
    const config = loadConfig(configPath);

    const results = generateSnippets(config, input.filter, {
      pathPrefix: input.pathPrefix,
    });

    return {
      success: true,
      count: results.length,
      snippets: results.map(r => ({
        id: r.screenshot.id,
        name: r.screenshot.name,
        snippet: r.snippet,
      })),
    };
  } catch (error) {
    return {
      success: false,
      count: 0,
      snippets: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
