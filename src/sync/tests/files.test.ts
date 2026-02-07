import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deleteStaleFiles, findStaleFiles, getExistingFiles } from '../files';

const TEST_DIR = path.join(process.cwd(), '.test-sync-files');

describe('getExistingFiles', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('returns empty array for non-existent directory', () => {
    const files = getExistingFiles('/non/existent/path');
    expect(files).toEqual([]);
  });

  it('returns empty array for empty directory', () => {
    const files = getExistingFiles(TEST_DIR);
    expect(files).toEqual([]);
  });

  it('returns only png and jpg files', () => {
    writeFileSync(path.join(TEST_DIR, 'screenshot1.png'), '');
    writeFileSync(path.join(TEST_DIR, 'screenshot2.jpg'), '');
    writeFileSync(path.join(TEST_DIR, 'document.txt'), '');
    writeFileSync(path.join(TEST_DIR, 'config.json'), '');

    const files = getExistingFiles(TEST_DIR);
    expect([...files].sort((a, b) => a.localeCompare(b))).toEqual(
      ['screenshot1.png', 'screenshot2.jpg'].sort((a, b) => a.localeCompare(b))
    );
  });

  it('handles mixed file types', () => {
    writeFileSync(path.join(TEST_DIR, 'a.png'), '');
    writeFileSync(path.join(TEST_DIR, 'b.jpg'), '');
    writeFileSync(path.join(TEST_DIR, 'c.jpeg'), ''); // Not included - only .jpg

    const files = getExistingFiles(TEST_DIR);
    expect([...files].sort((a, b) => a.localeCompare(b))).toEqual(
      ['a.png', 'b.jpg'].sort((a, b) => a.localeCompare(b))
    );
  });

  it('returns files from subdirectories with relative paths', () => {
    const subDir = path.join(TEST_DIR, 'registry');
    mkdirSync(subDir, { recursive: true });
    writeFileSync(path.join(TEST_DIR, 'top-level.png'), '');
    writeFileSync(path.join(subDir, 'login-01-light.png'), '');
    writeFileSync(path.join(subDir, 'login-01-dark.png'), '');

    const files = getExistingFiles(TEST_DIR);
    expect([...files].sort((a, b) => a.localeCompare(b))).toEqual([
      'registry/login-01-dark.png',
      'registry/login-01-light.png',
      'top-level.png',
    ]);
  });

  it('returns files from deeply nested subdirectories', () => {
    const deepDir = path.join(TEST_DIR, 'components', 'ui', 'buttons');
    mkdirSync(deepDir, { recursive: true });
    writeFileSync(path.join(deepDir, 'primary.png'), '');

    const files = getExistingFiles(TEST_DIR);
    expect(files).toEqual(['components/ui/buttons/primary.png']);
  });
});

describe('deleteStaleFiles', () => {
  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('deletes specified files and returns deleted list', () => {
    writeFileSync(path.join(TEST_DIR, 'stale1.png'), '');
    writeFileSync(path.join(TEST_DIR, 'stale2.png'), '');
    writeFileSync(path.join(TEST_DIR, 'keep.png'), '');

    const deleted = deleteStaleFiles(TEST_DIR, ['stale1.png', 'stale2.png']);

    expect([...deleted].sort((a, b) => a.localeCompare(b))).toEqual(
      ['stale1.png', 'stale2.png'].sort((a, b) => a.localeCompare(b))
    );
    expect(existsSync(path.join(TEST_DIR, 'stale1.png'))).toBe(false);
    expect(existsSync(path.join(TEST_DIR, 'stale2.png'))).toBe(false);
    expect(existsSync(path.join(TEST_DIR, 'keep.png'))).toBe(true);
  });

  it('handles non-existent files gracefully', () => {
    const deleted = deleteStaleFiles(TEST_DIR, ['nonexistent.png']);
    expect(deleted).toEqual([]);
  });

  it('returns empty array when no files to delete', () => {
    const deleted = deleteStaleFiles(TEST_DIR, []);
    expect(deleted).toEqual([]);
  });
});

describe('findStaleFiles', () => {
  it('finds files that exist but were not written', () => {
    const existing = ['old1.png', 'old2.png', 'new.png'];
    const written = new Set(['new.png']);

    const stale = findStaleFiles(existing, written);
    expect([...stale].sort((a, b) => a.localeCompare(b))).toEqual(
      ['old1.png', 'old2.png'].sort((a, b) => a.localeCompare(b))
    );
  });

  it('returns empty array when all files are current', () => {
    const existing = ['a.png', 'b.png'];
    const written = new Set(['a.png', 'b.png']);

    const stale = findStaleFiles(existing, written);
    expect(stale).toEqual([]);
  });

  it('returns all files when none were written', () => {
    const existing = ['a.png', 'b.png'];
    const written = new Set<string>();

    const stale = findStaleFiles(existing, written);
    expect([...stale].sort((a, b) => a.localeCompare(b))).toEqual(
      ['a.png', 'b.png'].sort((a, b) => a.localeCompare(b))
    );
  });

  it('handles empty existing files', () => {
    const existing: string[] = [];
    const written = new Set(['a.png']);

    const stale = findStaleFiles(existing, written);
    expect(stale).toEqual([]);
  });
});
