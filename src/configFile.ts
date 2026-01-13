import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseConfig } from './config';
import type { Config } from './types';

const HEROSHOT_DIRECTORY_NAME = '.heroshot';
const CONFIG_FILENAME = 'config.json';

/**
 * Get the .heroshot directory path for a project
 */
export function getHeroshotDirectory(directory: string = process.cwd()): string {
  return path.join(directory, HEROSHOT_DIRECTORY_NAME);
}

const README_CONTENT = `# Heroshot

This folder contains heroshot configuration and encrypted session data.

## Files

- \`config.json\` - Screenshot definitions (URLs, selectors, output settings)
- \`session.enc\` - Encrypted browser session (cookies, localStorage)

## Safe to commit

This folder is safe to commit to source control:

- \`config.json\` contains no secrets
- \`session.enc\` is encrypted with AES-256-GCM

## CI/CD Usage

To use heroshot in CI, add your session key as a secret:

\`\`\`yaml
- run: npx heroshot --session-key=\${{ secrets.HEROSHOT_SESSION_KEY }}
\`\`\`

To get your session key, run: \`npx heroshot session-key\`

Learn more: https://heroshot.sh/docs
`;

/**
 * Ensure .heroshot directory exists with README
 */
export function ensureHeroshotDirectory(directory: string = process.cwd()): string {
  const heroshotPath = getHeroshotDirectory(directory);
  const readmePath = path.join(heroshotPath, 'README.md');

  if (!existsSync(heroshotPath)) {
    mkdirSync(heroshotPath, { recursive: true });
    writeFileSync(readmePath, README_CONTENT, 'utf8');
  } else if (!existsSync(readmePath)) {
    writeFileSync(readmePath, README_CONTENT, 'utf8');
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
