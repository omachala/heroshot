import { existsSync, rmSync } from 'node:fs';
import { Command } from 'commander';
import { getProfilePath, setup } from './browser';
import { getConfigPath } from './configFile';
import { log, setVerbose } from './logger';
import { sync } from './sync';

const program = new Command();

program
  .name('heroshot')
  .description('Define your screenshots once, update them forever with one command')
  .version('0.0.2-alpha.2')
  .option('-v, --verbose', 'Show detailed output')
  .hook('preAction', () => {
    const options = program.opts<{ verbose?: boolean }>();
    setVerbose(options.verbose ?? false);
  });

// Default command: check for config, run setup if missing, otherwise sync
program
  .command('run', { isDefault: true, hidden: true })
  .description('Run heroshot (setup if no config, otherwise sync)')
  .action(async () => {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      // Config exists - run sync
      const result = await sync({});
      if (result.failed > 0) {
        process.exitCode = 1;
      }
    } else {
      // No config - run setup, then auto-sync if there are screenshots
      const { hasScreenshots } = await setup();
      if (hasScreenshots) {
        log('');
        const result = await sync({});
        if (result.failed > 0) {
          process.exitCode = 1;
        }
      }
    }
  });

program
  .command('config')
  .description('Open browser to add/edit screenshot definitions')
  .option('--reset', 'Clear existing browser profile and start fresh')
  .option('--only', 'Only run config, skip sync afterwards')
  .action(async (options: { reset?: boolean; only?: boolean }) => {
    if (options.reset) {
      const profilePath = getProfilePath();
      if (existsSync(profilePath)) {
        rmSync(profilePath, { recursive: true });
        log.verbose('Browser profile cleared.');
      }
    }
    const { hasScreenshots } = await setup();
    if (hasScreenshots && !options.only) {
      log('');
      const result = await sync({});
      if (result.failed > 0) {
        process.exitCode = 1;
      }
    }
  });

program.parse();
