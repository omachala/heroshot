import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseConfig, type Config } from './config.js';

const CONFIG_FILENAME = 'heroshot.json';

export function getConfigPath(dir: string = process.cwd()): string {
  return path.join(dir, CONFIG_FILENAME);
}

export function loadConfig(configPath: string): Config {
  if (!fs.existsSync(configPath)) {
    return { screenshots: [] };
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const json: unknown = JSON.parse(content);
  return parseConfig(json);
}

export function saveConfig(configPath: string, config: Config): void {
  const content = JSON.stringify(config, null, 2);
  fs.writeFileSync(configPath, content, 'utf-8');
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
