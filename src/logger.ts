/**
 * Simple logger with verbose mode support
 *
 * Usage:
 *   log('Always shown')
 *   log.verbose('Only shown with --verbose')
 *   log.error('Error message')
 */

let verboseEnabled = false;

export function setVerbose(enabled: boolean): void {
  verboseEnabled = enabled;
}

/**
 * Log a message (always shown)
 */
export function log(message: string): void {
  console.log(message);
}

/**
 * Log a verbose message (only shown with --verbose)
 */
log.verbose = (message: string): void => {
  if (verboseEnabled) {
    console.log(message);
  }
};

/**
 * Log an error message
 */
log.error = (message: string): void => {
  console.error(message);
};
