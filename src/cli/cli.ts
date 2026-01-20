import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import type { ShotCommandOptions } from '../types';
import { intro, setVerbose } from '../ui';
import { configAction, sessionKeyAction, shotAction } from './handlers';
import type { ConfigActionOptions, GlobalOptions } from './types';

// Read version from package.json (built file is dist/cli.js, so just one level up)
const packageJsonPath = path.join(import.meta.dirname, '..', 'package.json');
const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version =
  packageJson && typeof packageJson === 'object' && 'version' in packageJson
    ? String(packageJson.version)
    : '0.0.0';

const program = new Command();

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

// Default command: handle URL capture OR run setup/sync
program
  .command('oneshot [url]', { isDefault: true })
  .description('Capture URL directly, or sync all screenshots from config')
  .option('--selector <selector...>', 'CSS selector(s) to capture')
  .option('-o, --output <file>', 'Output filename')
  .option('-p, --padding <pixels>', 'Padding around element', parseInt)
  .option('-w, --width <pixels>', 'Viewport width', parseInt)
  .option('--height <pixels>', 'Viewport height', parseInt)
  .option('--mobile', 'Use mobile viewport (375x667)')
  .option('--tablet', 'Use tablet viewport (768x1024)')
  .option('--desktop', 'Use desktop viewport (1280x800)')
  .option('--dark', 'Force dark color scheme')
  .option('--light', 'Force light color scheme')
  .option('--scale <factor>', 'Device scale factor (1, 2, 3)', parseInt)
  .option('--retina', 'Use retina scale (2x)')
  .option('-q, --quality <percent>', 'JPEG quality (1-100), outputs JPEG', parseInt)
  .option('--viewport-only', 'Capture only viewport (not full page)')
  .option('--save', 'Save screenshot definition to config')
  .option('--clean', 'Delete stale files in output directory')
  .action(async (url?: string, options?: ShotCommandOptions) => {
    const globalOptions = program.opts<GlobalOptions>();
    const success = await shotAction(url, options, globalOptions);
    if (!success) process.exitCode = 1;
  });

program
  .command('config')
  .description('Open browser to add/edit screenshot definitions')
  .option('--reset', 'Clear existing session and start fresh')
  .option('--only', 'Only run config, skip sync afterwards')
  .option('--light', 'Force light mode (prefers-color-scheme: light)')
  .option('--dark', 'Force dark mode (prefers-color-scheme: dark)')
  .action(async (options: ConfigActionOptions) => {
    const globalOptions = program.opts<GlobalOptions>();
    const success = await configAction(options, globalOptions);
    if (!success) process.exitCode = 1;
  });

program
  .command('session-key')
  .description('Print the session key for this project (for CI setup)')
  .action(() => {
    const success = sessionKeyAction();
    if (!success) process.exitCode = 1;
  });

program.parse();
