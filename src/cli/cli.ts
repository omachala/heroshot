import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import type { ShotCommandOptions } from '../types';
import { intro, setVerbose } from '../ui';
import { configAction, sessionKeyAction, shotAction } from './handlers';
import { type ListOptions, listAction } from './list';
import { type SnippetOptions, snippetAction } from './snippet';
import type { ConfigActionOptions, GlobalOptions } from './types';

// Version is injected at build time for standalone binaries, or read from package.json for development
declare const HEROSHOT_VERSION: string | undefined;

function getVersion(): string {
  // Use build-time injected version if available (standalone binary)
  // eslint-disable-next-line unicorn/no-typeof-undefined -- Must use typeof to avoid ReferenceError when variable doesn't exist at runtime
  if (typeof HEROSHOT_VERSION !== 'undefined') {
    return HEROSHOT_VERSION;
  }

  // Fall back to reading package.json (development / npm package)
  // From src/cli/cli.ts or dist/cli/cli.js, go up two levels to reach package root
  try {
    const packageJsonPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      'package.json'
    );
    const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    if (packageJson && typeof packageJson === 'object' && 'version' in packageJson) {
      return String(packageJson.version);
    }
  } catch {
    // Ignore errors
  }
  return '0.0.0';
}

const version = getVersion();

const program = new Command();

program
  .name('heroshot')
  .description('Define your screenshots once, update them forever with one command')
  .version(version)
  .option('-v, --verbose', 'Show detailed output')
  .option('-c, --config <path>', 'Path to config file')
  .option('-s, --session-key <key>', 'Session key for encrypted auth (or set HEROSHOT_SESSION_KEY)')
  .hook('preAction', (_thisCommand, actionCommand) => {
    const options = program.opts<GlobalOptions>();
    setVerbose(options.verbose ?? false);
    // Skip intro banner for the MCP server — it speaks JSON-RPC over stdio
    if (actionCommand.name() === 'mcp') return;
    intro(version);
  });

// Default command: handle URL capture OR run setup/sync
program
  .command('oneshot [url]', { isDefault: true })
  .description('Capture URL directly, or sync all screenshots from config')
  .option('--selector <selector...>', 'CSS selector(s) to capture')
  .option('-o, --output <file>', 'Output filename')
  .option('-p, --padding <pixels>', 'Padding around element', Number.parseInt)
  .option('-w, --width <pixels>', 'Viewport width', Number.parseInt)
  .option('--height <pixels>', 'Viewport height', Number.parseInt)
  .option('--mobile', 'Use mobile viewport (430x932)')
  .option('--tablet', 'Use tablet viewport (768x1024)')
  .option('--desktop', 'Use desktop viewport (1280x800)')
  .option('--dark', 'Force dark color scheme')
  .option('--light', 'Force light color scheme')
  .option('--scale <factor>', 'Device scale factor (1, 2, 3)', Number.parseInt)
  .option('--retina', 'Use retina scale (2x)')
  .option('-q, --quality <percent>', 'JPEG quality (1-100), outputs JPEG', Number.parseInt)
  .option('--viewport-only', 'Capture only viewport (not full page)')
  .option('--reduced-motion', 'Emulate prefers-reduced-motion: reduce (disables animations)')
  .option('--user-agent <string>', 'Custom user agent string')
  .option('--ignore-https-errors', 'Ignore TLS certificate errors (self-signed certs, dev only)')
  .option('--save', 'Save screenshot definition to config')
  .option('--clean', 'Delete stale files in output directory')
  .option('--workers <count>', 'Number of parallel capture workers', Number.parseInt)
  .option('--headed', 'Run browser in headed mode (visible window) for debugging')
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

program
  .command('snippet [pattern]')
  .description('Generate markdown/HTML snippets for GitHub README and Wiki')
  .option('--path-prefix <prefix>', 'Image path prefix (default: ./heroshots/)')
  .action((pattern?: string, options?: SnippetOptions) => {
    const globalOptions = program.opts<GlobalOptions>();
    const success = snippetAction(pattern, options ?? {}, globalOptions.config);
    if (!success) process.exitCode = 1;
  });

program
  .command('mcp')
  .description('Start the MCP (Model Context Protocol) server over stdio')
  .action(async () => {
    const { startMcpServer } = await import('../mcp/server');
    await startMcpServer();
  });

program
  .command('list')
  .description('List all configured screenshots')
  .option('--json', 'Output as JSON')
  .action((options: ListOptions) => {
    const globalOptions = program.opts<GlobalOptions>();
    const success = listAction(options, globalOptions);
    if (!success) process.exitCode = 1;
  });

program.parse();
