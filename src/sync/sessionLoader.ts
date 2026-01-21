/**
 * Session loading utilities for sync operations.
 */

import type { BrowserContextOptions } from 'playwright';
import { getSessionKey, loadSession, sessionExists } from '../session';
import { verbose } from '../ui';

/**
 * Load encrypted session if available.
 * Returns storageState for browser context or undefined if no session.
 */
// eslint-disable-next-line sonarjs/function-return-type -- union return is intentional
export function loadEncryptedSession(
  sessionKeyOption?: string
): BrowserContextOptions['storageState'] | undefined {
  const sessionKey = getSessionKey(sessionKeyOption);
  if (!sessionKey || !sessionExists()) {
    return undefined;
  }

  const state = loadSession(sessionKey);
  if (state) {
    verbose('Using encrypted session');
    // eslint-disable-next-line no-restricted-syntax -- deserialized session data
    return state as BrowserContextOptions['storageState'];
  }

  verbose('Failed to decrypt session - using fresh browser');
  return undefined;
}
