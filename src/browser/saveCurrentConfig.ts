import { loadConfig, saveConfig } from '../configFile';
import { verbose } from '../ui';
import { toConfigScreenshot } from './toConfigScreenshot';
import type { BrowserSettings, ScreenshotData } from './types';

/**
 * Save current screenshot and browser settings state to config file.
 */
export function saveCurrentConfig(
  configPath: string,
  allScreenshots: ScreenshotData[],
  browserSettings: BrowserSettings | null
): void {
  const config = loadConfig(configPath);

  // Rebuild screenshots array from current state
  config.screenshots = allScreenshots.map(toConfigScreenshot);

  // Update browser settings if changed
  if (browserSettings) {
    config.browser = {
      ...config.browser,
      viewport: browserSettings.viewport,
      ...(browserSettings.colorScheme && { colorScheme: browserSettings.colorScheme }),
      ...(browserSettings.deviceScaleFactor && {
        deviceScaleFactor: browserSettings.deviceScaleFactor,
      }),
    };
  }

  saveConfig(configPath, config);
  verbose('Config saved');
}
