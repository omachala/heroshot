/**
 * Terminal UI using @clack/prompts
 *
 * Beautiful, minimal CLI output with spinners and styled messages.
 */

import {
  intro as clackIntro,
  log as clackLog,
  note as clackNote,
  outro as clackOutro,
  spinner as clackSpinner,
} from '@clack/prompts';

// ANSI escape codes for styling
const RESET = '\u001B[0m';
const DIM = '\u001B[2m';
const BOLD = '\u001B[1m';
const GREEN = '\u001B[32m';
const RED = '\u001B[31m';
const YELLOW = '\u001B[33m';
const CYAN = '\u001B[36m';

// ANSI colors for inline styling
const colors = {
  dim: (text: string) => `${DIM}${text}${RESET}`,
  green: (text: string) => `${GREEN}${text}${RESET}`,
  red: (text: string) => `${RED}${text}${RESET}`,
  yellow: (text: string) => `${YELLOW}${text}${RESET}`,
  cyan: (text: string) => `${CYAN}${text}${RESET}`,
  bold: (text: string) => `${BOLD}${text}${RESET}`,
};

let verboseEnabled = false;

export function setVerbose(enabled: boolean): void {
  verboseEnabled = enabled;
}

export function isVerbose(): boolean {
  return verboseEnabled;
}

/**
 * Show intro banner with version
 */
export function intro(version: string): void {
  const versionText = colors.dim(`v${version}`);
  clackIntro(`heroshot ${versionText}`);
}

/**
 * Show outro message
 */
export function outro(text: string): void {
  clackOutro(text);
}

/**
 * Show success message with checkmark
 */
export function success(text: string): void {
  clackLog.success(text);
}

/**
 * Show error message
 */
export function error(text: string): void {
  clackLog.error(text);
}

/**
 * Show warning message
 */
export function warn(text: string): void {
  clackLog.warn(text);
}

/**
 * Show info message
 */
export function info(text: string): void {
  clackLog.info(text);
}

/**
 * Show message only in verbose mode
 */
export function verbose(text: string): void {
  if (verboseEnabled) {
    clackLog.info(colors.dim(text));
  }
}

/**
 * Show a note box with title and message
 */
export function note(text: string, title?: string): void {
  clackNote(text, title);
}

/**
 * Create a spinner for async operations
 */
export function spinner(): ReturnType<typeof clackSpinner> {
  return clackSpinner();
}

/**
 * Plain log (no styling) - for raw output like session keys
 */
export function log(text: string): void {
  // Using console.log directly for raw piping (e.g., session keys)
  console.log(text);
}

// Export color utilities for custom formatting
export { colors };
