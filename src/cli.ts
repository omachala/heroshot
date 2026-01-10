import { existsSync, rmSync } from 'node:fs';
import { Command } from 'commander';
import { captureUrl, getProfilePath, setup } from './browser';
import { sync } from './sync';

const program = new Command();

program
  .name('heroshot')
  .description('Define your screenshots once, update them forever with one command')
  .version('0.0.1');

program
  .command('setup', { isDefault: true })
  .description('Open browser to log in to sites you want to screenshot')
  .option('--reset', 'Clear existing browser profile and start fresh')
  .action(async (options: { reset?: boolean }) => {
    if (options.reset) {
      const profilePath = getProfilePath();
      if (existsSync(profilePath)) {
        rmSync(profilePath, { recursive: true });
        console.log('Browser profile cleared.');
      }
    }
    await setup();
  });

program
  .command('capture <url> <output>')
  .description('Capture a screenshot of a URL')
  .action(async (url: string, output: string) => {
    await captureUrl(url, output);
  });

program
  .command('init')
  .description('Create a heroshot.json config file')
  .action(() => {
    console.log('TODO: Create heroshot.json');
  });

program
  .command('sync')
  .description('Capture all screenshots defined in config')
  .option('--id <id>', 'Only capture a specific screenshot by ID')
  .action(async (options: { id?: string }) => {
    const result = await sync(options);
    if (result.failed > 0) {
      process.exitCode = 1;
    }
  });

program
  .command('check')
  .description('Check if screenshots are up-to-date (for CI)')
  .action(() => {
    console.log('TODO: Check screenshots');
  });

program.parse();
