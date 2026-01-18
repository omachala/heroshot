import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { setup } from './browser';
import { getConfigPath, loadConfig, saveConfig } from './configFile';
import { VIEWPORT_PRESETS } from './schema';
import { getSessionPath, loadLocalKey } from './session';
import { sync } from './sync';
import type { Config, Screenshot, ShotCommandOptions } from './types';
import { error, intro, log, outro, setVerbose, verbose } from './ui';
import { generateScreenshotFilename } from './utils/generateScreenshotFilename';
import { generateUid } from './utils/generateUid';

// Read version from package.json
const packageJsonPath = path.join(import.meta.dirname, '..', 'package.json');
const packageJson: unknown = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version =
  packageJson && typeof packageJson === 'object' && 'version' in packageJson
    ? String(packageJson.version)
    : '0.0.0';

const program = new Command();

type GlobalOptions = {
  verbose?: boolean;
  config?: string;
  sessionKey?: string;
};

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

/** Build a screenshot entry from CLI options */
function buildScreenshotEntry(url: string, options: ShotCommandOptions | undefined): Screenshot {
  const selectorValue = options?.selector?.[0];

  // Generate name from --output if provided, otherwise from URL
  // (filename will be derived from name at sync time)
  const outputFile = options?.output;
  const name = outputFile
    ? path.basename(outputFile, path.extname(outputFile))
    : path.basename(generateScreenshotFilename(url, selectorValue), '.png');

  const screenshot: Screenshot = {
    id: generateUid(),
    name,
    url,
    selector: selectorValue,
  };

  // Add padding if specified
  if (options?.padding) {
    screenshot.padding = {
      top: options.padding,
      right: options.padding,
      bottom: options.padding,
      left: options.padding,
    };
  }

  // Add viewport variant if specified
  if (options?.mobile) {
    screenshot.viewports = ['mobile'];
  } else if (options?.tablet) {
    screenshot.viewports = ['tablet'];
  } else if (options?.desktop) {
    screenshot.viewports = ['desktop'];
  }

  return screenshot;
}

/** Get color scheme from CLI options */
function getColorScheme(options: ShotCommandOptions | undefined): 'light' | 'dark' | undefined {
  if (options?.dark) return 'dark';
  if (options?.light) return 'light';
  return undefined;
}

/** Get device scale factor from CLI options */
function getDeviceScaleFactor(
  options: ShotCommandOptions | undefined,
  existingConfig: Config | undefined
): number | undefined {
  if (options?.retina) return 2;
  if (options?.scale) return options.scale;
  return existingConfig?.browser?.deviceScaleFactor;
}

/** Get viewport from CLI options */
// eslint-disable-next-line complexity -- handles multiple viewport sources
function getViewport(
  options: ShotCommandOptions | undefined,
  existingConfig: Config | undefined
): { width: number; height: number } | undefined {
  // Check preset flags first
  if (options?.mobile) return VIEWPORT_PRESETS.mobile;
  if (options?.tablet) return VIEWPORT_PRESETS.tablet;
  if (options?.desktop) return VIEWPORT_PRESETS.desktop;

  // Check custom dimensions
  if (options?.width || options?.height) {
    const base = existingConfig?.browser?.viewport;
    return {
      width: options?.width ?? base?.width ?? 1280,
      height: options?.height ?? base?.height ?? 800,
    };
  }

  return existingConfig?.browser?.viewport;
}

/** Build a Config object from CLI options for URL capture */
function buildShotConfig(
  url: string,
  options: ShotCommandOptions | undefined,
  existingConfig: Config | undefined
): Config {
  const screenshot = buildScreenshotEntry(url, options);
  const outputFormat = options?.quality ? 'jpeg' : (existingConfig?.outputFormat ?? 'png');

  return {
    outputDirectory: '.',
    outputFormat,
    jpegQuality: options?.quality ?? existingConfig?.jpegQuality ?? 80,
    browser: {
      viewport: getViewport(options, existingConfig),
      colorScheme: getColorScheme(options),
      deviceScaleFactor: getDeviceScaleFactor(options, existingConfig),
    },
    screenshots: [screenshot],
  };
}

/** Save screenshot to config file */
function saveScreenshotToConfig(
  configPath: string,
  screenshot: Screenshot,
  shotConfig: Config,
  existingConfig: Config | undefined
): void {
  const configForSave = existingConfig ?? loadConfig('');

  // Copy browser settings from shot config
  if (shotConfig.browser?.colorScheme) {
    configForSave.browser = {
      ...configForSave.browser,
      colorScheme: shotConfig.browser.colorScheme,
    };
  }
  if (shotConfig.browser?.deviceScaleFactor) {
    configForSave.browser = {
      ...configForSave.browser,
      deviceScaleFactor: shotConfig.browser.deviceScaleFactor,
    };
  }

  configForSave.screenshots.push(screenshot);
  saveConfig(configPath, configForSave);
  verbose(`Saved to config: ${screenshot.name}`);
}

/** Handle URL capture */
async function handleUrlCapture(
  url: string,
  options: ShotCommandOptions | undefined,
  configPath: string,
  sessionKey: string | undefined
): Promise<boolean> {
  const existingConfig = existsSync(configPath) ? loadConfig(configPath) : undefined;
  const shotConfig = buildShotConfig(url, options, existingConfig);

  // Determine output directory
  const outputDirectory = options?.output
    ? path.dirname(path.resolve(options.output))
    : process.cwd();

  const result = await sync({
    config: shotConfig,
    outputDirectory,
    sessionKey,
  });

  if (options?.save && result.failed === 0) {
    // eslint-disable-next-line prefer-destructuring -- clearer with explicit index
    const screenshot = shotConfig.screenshots[0];
    if (screenshot) {
      saveScreenshotToConfig(configPath, screenshot, shotConfig, existingConfig);
    }
  }

  return result.failed === 0;
}

/** Handle default command (setup or sync) */
async function handleDefaultCommand(
  configPath: string,
  sessionKey: string | undefined,
  hasExplicitConfig: boolean,
  clean?: boolean
): Promise<boolean> {
  if (existsSync(configPath)) {
    const result = await sync({ configPath, sessionKey, clean });
    return result.failed === 0;
  }

  if (hasExplicitConfig) {
    error(`Config file not found: ${configPath}`);
    return false;
  }

  const { hasScreenshots } = await setup();
  if (hasScreenshots) {
    const result = await sync({ clean });
    return result.failed === 0;
  }
  return true;
}

// Default command: handle URL capture OR run setup/sync
program
  .command('shot [url]', { isDefault: true, hidden: true })
  .description('Take a screenshot (URL capture mode, or sync if no URL)')
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
  .option('--omit-background', 'Transparent background (PNG only)')
  .option('--timeout <ms>', 'Timeout in milliseconds', parseInt)
  .option('--save', 'Save screenshot definition to config')
  .option('--clean', 'Delete stale files in output directory')
  .action(async (url?: string, options?: ShotCommandOptions) => {
    const globalOptions = program.opts<GlobalOptions>();
    const configPath = globalOptions.config ? path.resolve(globalOptions.config) : getConfigPath();

    if (url?.startsWith('http')) {
      const success = await handleUrlCapture(url, options, configPath, globalOptions.sessionKey);
      if (!success) process.exitCode = 1;
    } else if (url) {
      // URL doesn't look like a URL - treat as pattern for sync
      const result = await sync({
        configPath,
        sessionKey: globalOptions.sessionKey,
        filter: url,
        clean: options?.clean,
      });
      if (result.failed > 0) process.exitCode = 1;
    } else {
      const success = await handleDefaultCommand(
        configPath,
        globalOptions.sessionKey,
        !!globalOptions.config,
        options?.clean
      );
      if (!success) process.exitCode = 1;
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
