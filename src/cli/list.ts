/**
 * List command - Display configured screenshots
 */

import { existsSync } from 'node:fs';
import { getConfigPath, loadConfig } from '../configFile';
import { log } from '../ui';
import type { GlobalOptions } from './types';

export type ListOptions = {
  json?: boolean;
};

/**
 * List all configured screenshots
 */
export function listAction(options: ListOptions, globalOptions: GlobalOptions): boolean {
  const configPath = globalOptions.config ?? getConfigPath();

  if (!existsSync(configPath)) {
    log('No config file found. Run "heroshot config" to create one.');
    return false;
  }

  const config = loadConfig(configPath);

  if (config.screenshots.length === 0) {
    log('No screenshots configured. Run "heroshot config" to add some.');
    return true;
  }

  if (options.json) {
    console.log(JSON.stringify(config.screenshots, null, 2));
    return true;
  }

  // Table-style output
  log(`Found ${config.screenshots.length} screenshot(s):\n`);

  for (const screenshot of config.screenshots) {
    const selector = screenshot.selector ?? '(full page)';
    const viewports = screenshot.viewports?.join(', ') || 'default';
    const actions = screenshot.actions?.length ?? 0;

    log(`  ${screenshot.name}`);
    log(`    URL:      ${screenshot.url}`);
    log(`    Selector: ${selector}`);
    if (screenshot.viewports) {
      log(`    Viewports: ${viewports}`);
    }
    if (actions > 0) {
      log(`    Actions:  ${actions}`);
    }
    log('');
  }

  return true;
}
