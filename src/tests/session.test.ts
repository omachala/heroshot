/**
 * Unit tests for session.ts
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decrypt,
  encrypt,
  generateSessionKey,
  getSessionKey,
  getSessionPath,
  loadLocalKey,
  loadSession,
  saveLocalKey,
  saveSession,
  sessionExists,
} from '../session';

describe('generateSessionKey', () => {
  it('generates a 20-character key', () => {
    const key = generateSessionKey();
    expect(key).toHaveLength(20);
  });

  it('generates alphanumeric characters only', () => {
    const key = generateSessionKey();
    expect(key).toMatch(/^[A-Za-z0-9]+$/);
  });

  it('generates unique keys', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateSessionKey());
    }
    expect(keys.size).toBe(100);
  });
});

describe('encrypt and decrypt', () => {
  it('encrypts and decrypts data correctly', () => {
    const sessionKey = generateSessionKey();
    const data = 'Hello, World!';

    const encrypted = encrypt(data, sessionKey);
    const decrypted = decrypt(encrypted, sessionKey);

    expect(decrypted).toBe(data);
  });

  it('encrypts JSON data correctly', () => {
    const sessionKey = generateSessionKey();
    const data = JSON.stringify({ cookies: [], origins: [] });

    const encrypted = encrypt(data, sessionKey);
    const decrypted = decrypt(encrypted, sessionKey);

    expect(decrypted).toBe(data);
  });

  it('produces different ciphertext for same data (due to random salt/iv)', () => {
    const sessionKey = generateSessionKey();
    const data = 'Same data';

    const encrypted1 = encrypt(data, sessionKey);
    const encrypted2 = encrypt(data, sessionKey);

    expect(encrypted1.equals(encrypted2)).toBe(false);
  });

  it('fails to decrypt with wrong key', () => {
    const key1 = generateSessionKey();
    const key2 = generateSessionKey();
    const data = 'Secret data';

    const encrypted = encrypt(data, key1);

    expect(() => decrypt(encrypted, key2)).toThrow();
  });

  it('fails to decrypt tampered data', () => {
    const sessionKey = generateSessionKey();
    const data = 'Original data';

    const encrypted = encrypt(data, sessionKey);
    // Tamper with the ciphertext (XOR last byte)
    const lastIndex = encrypted.length - 1;
    encrypted[lastIndex] = (encrypted[lastIndex] ?? 0) ^ 0xff;

    expect(() => decrypt(encrypted, sessionKey)).toThrow();
  });
});

describe('session file operations', () => {
  let testDir: string;
  let heroshotDir: string;

  beforeEach(() => {
    testDir = path.join(
      tmpdir(),
      `heroshot-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    heroshotDir = path.join(testDir, '.heroshot');
    mkdirSync(heroshotDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('getSessionPath', () => {
    it('returns path to session.enc in .heroshot directory', () => {
      const sessionPath = getSessionPath(testDir);
      expect(sessionPath).toBe(path.join(testDir, '.heroshot', 'session.enc'));
    });
  });

  describe('sessionExists', () => {
    it('returns false when session file does not exist', () => {
      expect(sessionExists(testDir)).toBe(false);
    });

    it('returns true when session file exists', () => {
      const sessionPath = getSessionPath(testDir);
      writeFileSync(sessionPath, 'test');
      expect(sessionExists(testDir)).toBe(true);
    });
  });

  describe('saveSession and loadSession', () => {
    it('saves and loads session correctly', () => {
      const sessionKey = generateSessionKey();
      const storageState = { cookies: [{ name: 'test', value: '123' }], origins: [] };

      saveSession(storageState, sessionKey, testDir);
      const loaded = loadSession(sessionKey, testDir);

      expect(loaded).toEqual(storageState);
    });

    it('creates .heroshot directory if it does not exist', () => {
      const newTestDir = path.join(tmpdir(), `heroshot-new-${Date.now()}`);
      const sessionKey = generateSessionKey();

      try {
        saveSession({ test: true }, sessionKey, newTestDir);
        expect(existsSync(path.join(newTestDir, '.heroshot', 'session.enc'))).toBe(true);
      } finally {
        if (existsSync(newTestDir)) {
          rmSync(newTestDir, { recursive: true, force: true });
        }
      }
    });

    it('returns null when session file does not exist', () => {
      const sessionKey = generateSessionKey();
      const result = loadSession(sessionKey, testDir);
      expect(result).toBeNull();
    });

    it('returns null when decryption fails (wrong key)', () => {
      const key1 = generateSessionKey();
      const key2 = generateSessionKey();

      saveSession({ test: true }, key1, testDir);
      const result = loadSession(key2, testDir);

      expect(result).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      const sessionKey = generateSessionKey();
      const sessionPath = getSessionPath(testDir);

      // Write invalid encrypted data
      const invalidData = encrypt('not valid json {{{', sessionKey);
      writeFileSync(sessionPath, invalidData);

      const result = loadSession(sessionKey, testDir);
      expect(result).toBeNull();
    });

    it('returns null for non-object JSON', () => {
      const sessionKey = generateSessionKey();
      const sessionPath = getSessionPath(testDir);

      // Write encrypted string (not an object)
      const stringData = encrypt('"just a string"', sessionKey);
      writeFileSync(sessionPath, stringData);

      const result = loadSession(sessionKey, testDir);
      expect(result).toBeNull();
    });
  });
});

describe('local key operations', () => {
  let testDir: string;
  const originalEnv = process.env;

  beforeEach(() => {
    testDir = path.join(
      tmpdir(),
      `heroshot-key-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(testDir, { recursive: true });
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('saveLocalKey and loadLocalKey', () => {
    it('saves and loads key correctly', () => {
      const sessionKey = generateSessionKey();

      saveLocalKey(sessionKey, testDir);
      const loaded = loadLocalKey(testDir);

      expect(loaded).toBe(sessionKey);
    });

    it('returns null when no key exists', () => {
      const result = loadLocalKey(testDir);
      expect(result).toBeNull();
    });

    it('trims whitespace from loaded key', () => {
      const sessionKey = generateSessionKey();
      saveLocalKey(sessionKey + '\n', testDir);

      const loaded = loadLocalKey(testDir);
      expect(loaded).toBe(sessionKey);
    });
  });

  describe('getSessionKey', () => {
    it('returns CLI key when provided', () => {
      const cliKey = 'cli-provided-key12345';
      process.env['HEROSHOT_SESSION_KEY'] = 'env-key';

      const result = getSessionKey(cliKey, testDir);
      expect(result).toBe(cliKey);
    });

    it('returns env key when CLI key not provided', () => {
      process.env['HEROSHOT_SESSION_KEY'] = 'env-key-12345678901';

      const result = getSessionKey(undefined, testDir);
      expect(result).toBe('env-key-12345678901');
    });

    it('returns local key when CLI and env not provided', () => {
      const localKey = generateSessionKey();
      saveLocalKey(localKey, testDir);
      delete process.env['HEROSHOT_SESSION_KEY'];

      const result = getSessionKey(undefined, testDir);
      expect(result).toBe(localKey);
    });

    it('returns null when no key available', () => {
      delete process.env['HEROSHOT_SESSION_KEY'];

      const result = getSessionKey(undefined, testDir);
      expect(result).toBeNull();
    });
  });
});
