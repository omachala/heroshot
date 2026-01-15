import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';

/**
 * Supported browser channels that Playwright can use
 */
export type BrowserChannel = 'chrome' | 'msedge' | 'chromium';

interface DetectedBrowser {
  channel: BrowserChannel;
  name: string;
  path: string;
}

/**
 * Browser detection paths by platform
 */
const BROWSER_PATHS: Record<string, Record<BrowserChannel, string[]>> = {
  darwin: {
    chrome: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    ],
    msedge: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
    chromium: [
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      // Homebrew Chromium
      '/opt/homebrew/bin/chromium',
      '/usr/local/bin/chromium',
    ],
  },
  linux: {
    chrome: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/snap/bin/chromium'],
    msedge: ['/usr/bin/microsoft-edge', '/usr/bin/microsoft-edge-stable'],
    chromium: ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'],
  },
  win32: {
    chrome: [
      String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
      String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
      String.raw`${process.env['LOCALAPPDATA'] ?? ''}\Google\Chrome\Application\chrome.exe`,
    ],
    msedge: [
      String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
      String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
    ],
    chromium: [],
  },
};

const BROWSER_NAMES: Record<BrowserChannel, string> = {
  chrome: 'Google Chrome',
  msedge: 'Microsoft Edge',
  chromium: 'Chromium',
};

/**
 * Check if a binary exists at path or via `which` on Unix
 */
function binaryExists(binaryPath: string): boolean {
  // Direct path check
  if (existsSync(binaryPath)) {
    return true;
  }

  // On Unix, also try `which` for binaries in PATH
  if (platform() !== 'win32') {
    try {
      // eslint-disable-next-line sonarjs/os-command -- which is safe with quoted path
      execSync(`which "${binaryPath}" 2>/dev/null`, { stdio: 'pipe' });
      return true;
    } catch {
      // Not found
    }
  }

  return false;
}

/**
 * Detect available system browsers
 * Returns browsers in order of preference: Chrome > Edge > Chromium
 */
export function detectSystemBrowsers(): DetectedBrowser[] {
  const currentPlatform = platform();
  // eslint-disable-next-line prefer-destructuring -- dynamic key access
  const paths = BROWSER_PATHS[currentPlatform];

  if (!paths) {
    return [];
  }

  const detected: DetectedBrowser[] = [];
  const channels: BrowserChannel[] = ['chrome', 'msedge', 'chromium'];

  for (const channel of channels) {
    // eslint-disable-next-line prefer-destructuring -- dynamic key access
    const browserPaths = paths[channel];
    for (const browserPath of browserPaths) {
      if (binaryExists(browserPath)) {
        detected.push({
          channel,
          name: BROWSER_NAMES[channel],
          path: browserPath,
        });
        break; // Found this browser, move to next channel
      }
    }
  }

  return detected;
}
