import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseConfig, type Config } from './config';

const CONFIG_FILENAME = 'heroshot.json';

export function getConfigPath(dir: string = process.cwd()): string {
  return join(dir, CONFIG_FILENAME);
}

export function loadConfig(configPath: string): Config {
  if (!existsSync(configPath)) {
    return { screenshots: [] };
  }

  const content = readFileSync(configPath, 'utf-8');
  const json: unknown = JSON.parse(content);
  return parseConfig(json);
}

export function saveConfig(configPath: string, config: Config): void {
  const content = JSON.stringify(config, null, 2);
  writeFileSync(configPath, content, 'utf-8');
}

export function generateScreenshotId(url: string, selector?: string): string {
  // Extract domain and path
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace(/\./g, '-');
  const pathPart = urlObj.pathname.replace(/\//g, '-').replace(/^-|-$/g, '');

  let id = domain;
  if (pathPart) {
    id += `-${pathPart}`;
  }

  // Add selector hint if present
  if (selector) {
    const selectorHint = selector
      .replace(/[#.>:[\]()]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20);
    if (selectorHint) {
      id += `-${selectorHint}`;
    }
  }

  return id.toLowerCase().slice(0, 50);
}
