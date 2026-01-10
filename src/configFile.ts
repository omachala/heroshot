import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { type Config, parseConfig } from './config';

const CONFIG_FILENAME = 'heroshot.json';

export function getConfigPath(directory: string = process.cwd()): string {
  return path.join(directory, CONFIG_FILENAME);
}

export function loadConfig(configPath: string): Config {
  if (!existsSync(configPath)) {
    return { screenshots: [] };
  }

  const content = readFileSync(configPath, 'utf8');
  const json: unknown = JSON.parse(content);
  return parseConfig(json);
}

export function saveConfig(configPath: string, config: Config): void {
  const content = JSON.stringify(config, null, 2);
  writeFileSync(configPath, content, 'utf8');
}

export function generateScreenshotId(url: string, selector?: string): string {
  // Extract domain and path
  const urlObject = new URL(url);
  const domain = urlObject.hostname.replaceAll('.', '-');
  const pathPart = urlObject.pathname.replaceAll('/', '-').replaceAll(/^-$|^-|-$/g, '');

  let id = domain;
  if (pathPart) {
    id += `-${pathPart}`;
  }

  // Add selector hint if present
  if (selector) {
    const selectorHint = selector
      .replaceAll(/[#.>:[\]()]/g, '-')
      .replaceAll(/-+/g, '-')
      .replaceAll(/(?:^-|-$)/g, '')
      .slice(0, 20);
    if (selectorHint) {
      id += `-${selectorHint}`;
    }
  }

  return id.toLowerCase().slice(0, 50);
}
