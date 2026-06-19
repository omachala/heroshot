import type { Config, ShotCommandOptions } from '../types';
import { buildScreenshotEntry } from './buildScreenshotEntry';
import { buildBrowserSettings } from './optionsParsers';

/**
 * Build a Config object from CLI options for URL capture.
 */
export function buildShotConfig(
  url: string,
  options: ShotCommandOptions | undefined,
  existingConfig: Config | undefined
): Config {
  const screenshot = buildScreenshotEntry(url, options);
  const outputFormat = options?.quality ? 'jpeg' : (existingConfig?.outputFormat ?? 'png');

  return {
    outputDirectory: '.',
    outputFormat,
    jpegQuality: options?.quality ?? existingConfig?.jpegQuality ?? 80,
    browser: buildBrowserSettings(options, existingConfig),
    screenshots: [screenshot],
  };
}
