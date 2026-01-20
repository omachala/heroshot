import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { setup } from '../browser';
import { getConfigPath, loadConfig, saveConfig } from '../configFile';
import { getSessionPath, loadLocalKey } from '../session';
import { sync } from '../sync';
import type { Config, Screenshot, ShotCommandOptions } from '../types';
import { error, log, outro, verbose } from '../ui';
import { buildShotConfig } from './buildShotConfig';
import type { ConfigActionOptions, GlobalOptions } from './types';

/**
 * Save screenshot to config file.
 */
export function saveScreenshotToConfig(
  configPath: string,
  screenshot: Screenshot,
  shotConfig: Config,
  existingConfig: Config | undefined
): void {
  const configForSave = existingConfig ?? loadConfig('');

  // Copy browser settings from shot config
  if (shotConfig.browser?.colorScheme) {
    configForSave.browser = {
      ...configForSave.browser,
      colorScheme: shotConfig.browser.colorScheme,
    };
  }
  if (shotConfig.browser?.deviceScaleFactor) {
    configForSave.browser = {
      ...configForSave.browser,
      deviceScaleFactor: shotConfig.browser.deviceScaleFactor,
    };
  }

  configForSave.screenshots.push(screenshot);
  saveConfig(configPath, configForSave);
  verbose(`Saved to config: ${screenshot.name}`);
}

/**
 * Handle URL capture command.
 */
export async function handleUrlCapture(
  url: string,
  options: ShotCommandOptions | undefined,
  configPath: string,
  sessionKey: string | undefined
): Promise<boolean> {
  const existingConfig = existsSync(configPath) ? loadConfig(configPath) : undefined;
  const shotConfig = buildShotConfig(url, options, existingConfig);

  // Determine output directory
  const outputDirectory = options?.output
    ? path.dirname(path.resolve(options.output))
    : process.cwd();

  const result = await sync({
    config: shotConfig,
    outputDirectory,
    sessionKey,
    skipStaleCheck: true, // Don't check for stale files in oneshot mode
    viewportOnly: options?.viewportOnly,
  });

  if (options?.save && result.failed === 0) {
    // eslint-disable-next-line prefer-destructuring -- clearer with explicit index
    const screenshot = shotConfig.screenshots[0];
    if (screenshot) {
      saveScreenshotToConfig(configPath, screenshot, shotConfig, existingConfig);
    }
  }

  return result.failed === 0;
}

/**
 * Handle default command (setup or sync).
 */
export async function handleDefaultCommand(
  configPath: string,
  sessionKey: string | undefined,
  hasExplicitConfig: boolean,
  clean?: boolean
): Promise<boolean> {
  if (existsSync(configPath)) {
    const result = await sync({ configPath, sessionKey, clean });
    return result.failed === 0;
  }

  if (hasExplicitConfig) {
    error(`Config file not found: ${configPath}`);
    return false;
  }

  const { hasScreenshots } = await setup();
  if (hasScreenshots) {
    const result = await sync({ clean });
    return result.failed === 0;
  }
  return true;
}

/**
 * Shot command action handler.
 * Returns true if successful, false otherwise.
 */
export async function shotAction(
  url: string | undefined,
  options: ShotCommandOptions | undefined,
  globalOptions: GlobalOptions
): Promise<boolean> {
  const configPath = globalOptions.config ? path.resolve(globalOptions.config) : getConfigPath();

  if (url?.startsWith('http')) {
    return handleUrlCapture(url, options, configPath, globalOptions.sessionKey);
  }

  if (url) {
    // URL doesn't look like a URL - treat as pattern for sync
    const result = await sync({
      configPath,
      sessionKey: globalOptions.sessionKey,
      filter: url,
      clean: options?.clean,
    });
    return result.failed === 0;
  }

  return handleDefaultCommand(
    configPath,
    globalOptions.sessionKey,
    !!globalOptions.config,
    options?.clean
  );
}

/**
 * Config command action handler.
 * Returns true if successful, false otherwise.
 */
export async function configAction(
  options: ConfigActionOptions,
  globalOptions: GlobalOptions
): Promise<boolean> {
  if (options.reset) {
    const sessionPath = getSessionPath();
    if (existsSync(sessionPath)) {
      rmSync(sessionPath);
      verbose('Session cleared.');
    }
  }

  // Determine color scheme: explicit flag > system default
  let colorScheme: 'light' | 'dark' | undefined;
  if (options.light) colorScheme = 'light';
  else if (options.dark) colorScheme = 'dark';

  const { hasScreenshots } = await setup({ colorScheme });
  if (hasScreenshots && !options.only) {
    const configPath = globalOptions.config ? path.resolve(globalOptions.config) : undefined;
    const result = await sync({ configPath, sessionKey: globalOptions.sessionKey });
    return result.failed === 0;
  }
  return true;
}

/**
 * Session-key command action handler.
 * Returns true if successful, false otherwise.
 */
export function sessionKeyAction(): boolean {
  const sessionKey = loadLocalKey();
  if (sessionKey) {
    // Plain output for easy copy/paste in CI
    log(sessionKey);
    outro('Copy this key to your CI secrets');
    return true;
  }
  error('No session key found. Run "heroshot config" first to generate one.');
  return false;
}
