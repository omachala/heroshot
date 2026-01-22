/**
 * Generate markdown/HTML snippets for GitHub README and Wiki.
 *
 * Generates `<picture>` elements with prefers-color-scheme media queries
 * for light/dark mode support in pure markdown environments.
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { getConfigPath, loadConfig } from '../configFile';
import { filterScreenshots } from '../sync/configHelpers';
import type { Config, Screenshot } from '../types';
import { error, log } from '../ui';
import { generateScreenshotFilename } from '../utils/screenshotPath';

export type SnippetOptions = {
  /** Output format */
  format?: 'html' | 'markdown';
  /** Custom path prefix for images (default: ./heroshots/) */
  pathPrefix?: string;
};

type SnippetResult = {
  screenshot: Screenshot;
  snippet: string;
};

/**
 * Check if a screenshot has light/dark variants (colorScheme not set = both).
 */
function hasColorSchemeVariants(config: Config): boolean {
  return config.browser?.colorScheme === undefined;
}

/**
 * Generate a single snippet for a screenshot.
 */
function generateSnippet(screenshot: Screenshot, config: Config, options: SnippetOptions): string {
  const { pathPrefix = './heroshots/' } = options;
  const format = config.outputFormat ?? 'png';
  const hasVariants = hasColorSchemeVariants(config);
  const viewports = screenshot.viewports ?? [];

  // For simplicity, use the first viewport or no viewport suffix
  const viewport = viewports.length > 0 ? viewports[0] : undefined;

  if (hasVariants) {
    // Generate <picture> with prefers-color-scheme
    const lightFile = generateScreenshotFilename({
      name: screenshot.name,
      viewport,
      colorScheme: 'light',
      format,
    });
    const darkFile = generateScreenshotFilename({
      name: screenshot.name,
      viewport,
      colorScheme: 'dark',
      format,
    });

    const lightPath = `${pathPrefix}${lightFile}`;
    const darkPath = `${pathPrefix}${darkFile}`;

    return `<picture>
  <source srcset="${darkPath}" media="(prefers-color-scheme: dark)">
  <img src="${lightPath}" alt="${screenshot.name}">
</picture>`;
  }

  // Single color scheme - just an img tag
  const filename = generateScreenshotFilename({
    name: screenshot.name,
    viewport,
    colorScheme: config.browser?.colorScheme,
    format,
  });

  return `![${screenshot.name}](${pathPrefix}${filename})`;
}

/**
 * Generate snippets for screenshots matching pattern.
 */
export function generateSnippets(
  config: Config,
  pattern?: string,
  options: SnippetOptions = {}
): SnippetResult[] {
  const filtered = filterScreenshots(config.screenshots, pattern);

  return filtered.map(screenshot => ({
    screenshot,
    snippet: generateSnippet(screenshot, config, options),
  }));
}

/**
 * Snippet command handler.
 */
export function snippetAction(
  pattern: string | undefined,
  options: SnippetOptions,
  configPath?: string
): boolean {
  const resolvedConfigPath = configPath ? path.resolve(configPath) : getConfigPath();

  if (!existsSync(resolvedConfigPath)) {
    error(`Config file not found: ${resolvedConfigPath}`);
    error('Run "heroshot config" to create one.');
    return false;
  }

  const config = loadConfig(resolvedConfigPath);

  if (config.screenshots.length === 0) {
    error('No screenshots defined in config.');
    return false;
  }

  const results = generateSnippets(config, pattern, options);

  if (results.length === 0) {
    error(`No screenshots matching "${pattern ?? ''}"`);
    return false;
  }

  // Output snippets
  for (const { screenshot, snippet } of results) {
    log(`\n<!-- heroshot: ${screenshot.name} (${screenshot.id}) -->`);
    log(snippet);
  }

  log('');

  return true;
}
