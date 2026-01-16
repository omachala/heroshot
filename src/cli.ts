import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { setup } from './browser';
import { getConfigPath, loadConfig, saveConfig } from './configFile';
import { oneshot } from './oneshot';
import { getSessionPath, loadLocalKey } from './session';
import { sync } from './sync';
import type { Config, OneshotCommandOptions, OneshotOptions, Screenshot } from './types';
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

/** Build oneshot options from CLI args and config defaults */
// eslint-disable-next-line complexity -- many options to map
function buildOneshotOptions(
  url: string,
  commandOptions: OneshotCommandOptions | undefined,
  existingConfig: Config | undefined,
  sessionKey: string | undefined
): OneshotOptions {
  const configOutputDirectory = existingConfig?.outputDirectory;
  const configScale = existingConfig?.browser?.deviceScaleFactor;
  const configFormat = existingConfig?.outputFormat;
  const configQuality = existingConfig?.jpegQuality;

  return {
    url,
    selector: commandOptions?.selector,
    output: commandOptions?.output,
    outputDirectory: commandOptions?.output ? undefined : configOutputDirectory,
    padding: commandOptions?.padding,
    width: commandOptions?.width,
    height: commandOptions?.height,
    mobile: commandOptions?.mobile,
    tablet: commandOptions?.tablet,
    desktop: commandOptions?.desktop,
    dark: commandOptions?.dark,
    light: commandOptions?.light,
    scale: commandOptions?.scale ?? (commandOptions?.retina ? undefined : configScale),
    retina: commandOptions?.retina,
    format: configFormat,
    quality: commandOptions?.quality ?? (configFormat === 'jpeg' ? configQuality : undefined),
    omitBackground: commandOptions?.omitBackground,
    timeout: commandOptions?.timeout,
    sessionKey,
  };
}

/** Save screenshot to config file */
function saveScreenshotToConfig(
  configPath: string,
  url: string,
  oneshotOptions: OneshotOptions,
  existingConfig: Config | undefined
): void {
  const configForSave = existingConfig ?? loadConfig('');
  const selectorValue = oneshotOptions.selector?.[0];
  const filename = oneshotOptions.output ?? generateScreenshotFilename(url, selectorValue);

  const screenshotEntry: Screenshot = {
    id: generateUid(),
    name: path.basename(filename, path.extname(filename)),
    url,
    filename,
    selector: selectorValue,
  };

  if (oneshotOptions.padding) {
    screenshotEntry.padding = {
      top: oneshotOptions.padding,
      right: oneshotOptions.padding,
      bottom: oneshotOptions.padding,
      left: oneshotOptions.padding,
    };
  }

  if (oneshotOptions.mobile) {
    screenshotEntry.viewports = ['mobile'];
  } else if (oneshotOptions.tablet) {
    screenshotEntry.viewports = ['tablet'];
  } else if (oneshotOptions.desktop) {
    screenshotEntry.viewports = ['desktop'];
  }

  if (oneshotOptions.dark) {
    configForSave.browser = { ...configForSave.browser, colorScheme: 'dark' };
  } else if (oneshotOptions.light) {
    configForSave.browser = { ...configForSave.browser, colorScheme: 'light' };
  }

  if (oneshotOptions.scale || oneshotOptions.retina) {
    configForSave.browser = {
      ...configForSave.browser,
      deviceScaleFactor: oneshotOptions.retina ? 2 : oneshotOptions.scale,
    };
  }

  configForSave.screenshots.push(screenshotEntry);
  saveConfig(configPath, configForSave);
  verbose(`Saved to config: ${screenshotEntry.name}`);
}

/** Handle one-shot URL capture */
async function handleOneshotCapture(
  url: string,
  commandOptions: OneshotCommandOptions | undefined,
  configPath: string,
  sessionKey: string | undefined
): Promise<boolean> {
  const existingConfig = existsSync(configPath) ? loadConfig(configPath) : undefined;
  const oneshotOptions = buildOneshotOptions(url, commandOptions, existingConfig, sessionKey);
  const result = await oneshot(oneshotOptions);

  if (commandOptions?.save && result.success) {
    saveScreenshotToConfig(configPath, url, oneshotOptions, existingConfig);
  }

  return result.success;
}

/** Handle default command (setup or sync) */
async function handleDefaultCommand(
  configPath: string,
  sessionKey: string | undefined,
  hasExplicitConfig: boolean
): Promise<boolean> {
  if (existsSync(configPath)) {
    const result = await sync({ configPath, sessionKey });
    return result.failed === 0;
  }

  if (hasExplicitConfig) {
    error(`Config file not found: ${configPath}`);
    return false;
  }

  const { hasScreenshots } = await setup();
  if (hasScreenshots) {
    const result = await sync({});
    return result.failed === 0;
  }
  return true;
}

// Default command: handle URL for one-shot OR run setup/sync
program
  .command('shot [url]', { isDefault: true, hidden: true })
  .description('Take a screenshot (one-shot mode with URL, or sync if no URL)')
  .option('--selector <selector...>', 'CSS selector(s) to capture')
  .option('-o, --output <file>', 'Output filename')
  .option('-p, --padding <pixels>', 'Padding around element', parseInt)
  .option('-w, --width <pixels>', 'Viewport width', parseInt)
  .option('-H, --height <pixels>', 'Viewport height', parseInt)
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
  .action(async (url?: string, commandOptions?: OneshotCommandOptions) => {
    const globalOptions = program.opts<GlobalOptions>();
    const configPath = globalOptions.config ? path.resolve(globalOptions.config) : getConfigPath();

    if (url?.startsWith('http')) {
      const success = await handleOneshotCapture(
        url,
        commandOptions,
        configPath,
        globalOptions.sessionKey
      );
      if (!success) process.exitCode = 1;
    } else if (url) {
      // URL doesn't look like a URL - treat as pattern for sync
      const result = await sync({ configPath, sessionKey: globalOptions.sessionKey, filter: url });
      if (result.failed > 0) process.exitCode = 1;
    } else {
      const success = await handleDefaultCommand(
        configPath,
        globalOptions.sessionKey,
        !!globalOptions.config
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
