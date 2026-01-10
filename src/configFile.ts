import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { type Config, parseConfig } from './config';

const CONFIG_FILENAME = 'heroshot.json';

export function getConfigPath(directory: string = process.cwd()): string {
  return path.join(directory, CONFIG_FILENAME);
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
  const content = JSON.stringify(config, null, 2);
  writeFileSync(configPath, content, 'utf8');
}
