import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { setup } from './browser';
import { getConfigPath } from './configFile';
import { getSessionPath, loadLocalKey } from './session';
import { sync } from './sync';
import { error, intro, log, outro, setVerbose, verbose } from './ui';

// Read version from package.json
const packageJsonPath = path.join(import.meta.dirname, '..', 'package.json');
const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version =
  packageJson && typeof packageJson === 'object' && 'version' in packageJson
    ? String(packageJson.version)
    : '0.0.0';

const program = new Command();

interface GlobalOptions {
  verbose?: boolean;
  config?: string;
  sessionKey?: string;
}

program
  .name('heroshot')
  .description('Define your screenshots once, update them forever with one command')
  .version(version)
  .option('-v, --verbose', 'Show detailed output')
  .option('-c, --config <path>', 'Path to config file')
  .option('-s, --session-key <key>', 'Session key for encrypted auth (or set HEROSHOT_SESSION_KEY)')
  .hook('preAction', () => {
    const options = program.opts<GlobalOptions>();
    setVerbose(options.verbose ?? false);
    intro(version);
  });

// Default command: check for config, run setup if missing, otherwise sync
program
  .command('run', { isDefault: true, hidden: true })
  .description('Run heroshot (setup if no config, otherwise sync)')
  .action(async () => {
    const options = program.opts<GlobalOptions>();
    const configPath = options.config ? path.resolve(options.config) : getConfigPath();

    if (existsSync(configPath)) {
      // Config exists - run sync
      const result = await sync({ configPath, sessionKey: options.sessionKey });
      if (result.failed > 0) {
        process.exitCode = 1;
      }
    } else {
      if (options.config) {
        // User specified a config that doesn't exist
        error(`Config file not found: ${configPath}`);
        process.exitCode = 1;
        return;
      }
      // No config - run setup, then auto-sync if there are screenshots
      const { hasScreenshots } = await setup();
      if (hasScreenshots) {
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
  .option('--reset', 'Clear existing session and start fresh')
  .option('--only', 'Only run config, skip sync afterwards')
  .option('--light', 'Force light mode (prefers-color-scheme: light)')
  .option('--dark', 'Force dark mode (prefers-color-scheme: dark)')
  .action(
    async (commandOptions: {
      reset?: boolean;
      only?: boolean;
      light?: boolean;
      dark?: boolean;
    }) => {
      const globalOptions = program.opts<GlobalOptions>();

      if (commandOptions.reset) {
        const sessionPath = getSessionPath();
        if (existsSync(sessionPath)) {
          rmSync(sessionPath);
          verbose('Session cleared.');
        }
      }

      // Determine color scheme: explicit flag > system default
      let colorScheme: 'light' | 'dark' | undefined;
      if (commandOptions.light) colorScheme = 'light';
      else if (commandOptions.dark) colorScheme = 'dark';

      const { hasScreenshots } = await setup({ colorScheme });
      if (hasScreenshots && !commandOptions.only) {
        const configPath = globalOptions.config ? path.resolve(globalOptions.config) : undefined;
        const result = await sync({ configPath, sessionKey: globalOptions.sessionKey });
        if (result.failed > 0) {
          process.exitCode = 1;
        }
      }
    }
  );

program
  .command('sync [pattern]')
  .description('Capture screenshots (optionally filter by pattern)')
  .action(async (pattern?: string) => {
    const options = program.opts<GlobalOptions>();
    const configPath = options.config ? path.resolve(options.config) : getConfigPath();

    if (!existsSync(configPath)) {
      error('No config found. Run "heroshot config" first.');
      process.exitCode = 1;
      return;
    }

    const result = await sync({
      configPath,
      sessionKey: options.sessionKey,
      filter: pattern,
    });
    if (result.failed > 0) {
      process.exitCode = 1;
    }
  });

program
  .command('session-key')
  .description('Print the session key for this project (for CI setup)')
  .action(() => {
    const sessionKey = loadLocalKey();
    if (sessionKey) {
      // Plain output for easy copy/paste in CI
      log(sessionKey);
      outro('Copy this key to your CI secrets');
    } else {
      error('No session key found. Run "heroshot config" first to generate one.');
      process.exitCode = 1;
    }
  });

program.parse();
