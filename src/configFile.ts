import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseConfig } from './config';
import type { Config } from './types';

const HEROSHOT_DIRECTORY_NAME = '.heroshot';
const CONFIG_FILENAME = 'config.json';
const README_TEMPLATE_PATH = path.join(import.meta.dirname, 'templates', 'heroshotReadme.txt');

/**
 * Get the .heroshot directory path for a project
 */
export function getHeroshotDirectory(directory: string = process.cwd()): string {
  return path.join(directory, HEROSHOT_DIRECTORY_NAME);
}

/**
 * Ensure .heroshot directory exists with README
 */
export function ensureHeroshotDirectory(directory: string = process.cwd()): string {
  const heroshotPath = getHeroshotDirectory(directory);
  const readmePath = path.join(heroshotPath, 'README.md');

  if (!existsSync(heroshotPath)) {
    mkdirSync(heroshotPath, { recursive: true });
    const readmeContent = readFileSync(README_TEMPLATE_PATH, 'utf8');
    writeFileSync(readmePath, readmeContent, 'utf8');
  } else if (!existsSync(readmePath)) {
    const readmeContent = readFileSync(README_TEMPLATE_PATH, 'utf8');
    writeFileSync(readmePath, readmeContent, 'utf8');
  }

  return heroshotPath;
}

/**
 * Get config path (.heroshot/config.json)
 */
export function getConfigPath(directory: string = process.cwd()): string {
  return path.join(directory, HEROSHOT_DIRECTORY_NAME, CONFIG_FILENAME);
}

export function loadConfig(configPath: string): Config {
  if (!existsSync(configPath)) {
    // Return default config with Zod defaults applied
    return parseConfig({});
  }

  const content = readFileSync(configPath, 'utf8');
  const json: unknown = JSON.parse(content);
  return parseConfig(json);
}

export function saveConfig(configPath: string, config: Config): void {
  // Ensure parent directory exists (for .heroshot/config.json)
  const parentDirectory = path.dirname(configPath);
  if (!existsSync(parentDirectory)) {
    mkdirSync(parentDirectory, { recursive: true });
  }

  const content = JSON.stringify(config, null, 2);
  writeFileSync(configPath, content, 'utf8');
}
