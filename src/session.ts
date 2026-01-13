import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { getHeroshotDirectory } from './configFile';

const SESSION_FILENAME = 'session.enc';
const KEYS_DIRECTORY = path.join(homedir(), '.heroshot', 'keys');
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const SESSION_KEY_LENGTH = 20; // ~119 bits of entropy

/**
 * Generate a session key (alphanumeric characters)
 */
export function generateSessionKey(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(SESSION_KEY_LENGTH);

  return [...bytes].map(byte => alphabet[byte % alphabet.length]).join('');
}

/**
 * Derive encryption key from session key using scrypt
 */
function deriveKey(sessionKey: string, salt: Buffer): Buffer {
  return scryptSync(sessionKey, salt, KEY_LENGTH);
}

/**
 * Encrypt data with session key
 * Returns: salt (16) + iv (16) + authTag (16) + ciphertext
 */
export function encrypt(data: string, sessionKey: string): Buffer {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(sessionKey, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypt data with session key
 */
export function decrypt(encryptedData: Buffer, sessionKey: string): string {
  const salt = encryptedData.subarray(0, SALT_LENGTH);
  const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const ciphertext = encryptedData.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(sessionKey, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Get project identifier for key storage (hash of project path)
 */
function getProjectId(directory: string = process.cwd()): string {
  const hash = createHash('sha256').update(directory).digest('hex');
  return hash.slice(0, 16);
}

/**
 * Get path to session.enc file
 */
export function getSessionPath(directory: string = process.cwd()): string {
  return path.join(getHeroshotDirectory(directory), SESSION_FILENAME);
}

/**
 * Get path to local key file for a project
 */
function getLocalKeyPath(directory: string = process.cwd()): string {
  const projectId = getProjectId(directory);
  return path.join(KEYS_DIRECTORY, projectId);
}

/**
 * Save session key locally (for seamless local dev)
 */
export function saveLocalKey(sessionKey: string, directory: string = process.cwd()): void {
  if (!existsSync(KEYS_DIRECTORY)) {
    mkdirSync(KEYS_DIRECTORY, { recursive: true, mode: 0o700 });
  }

  const keyPath = getLocalKeyPath(directory);
  writeFileSync(keyPath, sessionKey, { encoding: 'utf8', mode: 0o600 });
}

/**
 * Load session key from local storage
 */
export function loadLocalKey(directory: string = process.cwd()): string | null {
  const keyPath = getLocalKeyPath(directory);

  if (!existsSync(keyPath)) {
    return null;
  }

  return readFileSync(keyPath, 'utf8').trim();
}

/**
 * Save encrypted session to .heroshot/session.enc
 */
export function saveSession(
  storageState: object,
  sessionKey: string,
  directory: string = process.cwd()
): void {
  const heroshotPath = getHeroshotDirectory(directory);
  if (!existsSync(heroshotPath)) {
    mkdirSync(heroshotPath, { recursive: true });
  }

  const json = JSON.stringify(storageState);
  const encrypted = encrypt(json, sessionKey);
  const sessionPath = getSessionPath(directory);

  writeFileSync(sessionPath, encrypted, { mode: 0o644 });
}

/**
 * Load and decrypt session from .heroshot/session.enc
 */
export function loadSession(sessionKey: string, directory: string = process.cwd()): object | null {
  const sessionPath = getSessionPath(directory);

  if (!existsSync(sessionPath)) {
    return null;
  }

  try {
    const encrypted = readFileSync(sessionPath);
    const json = decrypt(encrypted, sessionKey);
    const parsed: unknown = JSON.parse(json);
    // Validate it's a plain object (storage state shape)
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if session file exists
 */
export function sessionExists(directory: string = process.cwd()): boolean {
  return existsSync(getSessionPath(directory));
}

/**
 * Get session key - from CLI arg, env var, or local storage
 */
export function getSessionKey(cliKey?: string, directory: string = process.cwd()): string | null {
  // Priority: CLI arg > env var > local storage
  if (cliKey) {
    return cliKey;
  }

  // eslint-disable-next-line prefer-destructuring -- env vars use bracket notation
  const environmentKey = process.env['HEROSHOT_SESSION_KEY'];
  if (environmentKey) {
    return environmentKey;
  }

  return loadLocalKey(directory);
}
