import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWPORT, EDITOR_DIR } from '../constants';

describe('constants', () => {
  describe('DEFAULT_VIEWPORT', () => {
    it('has expected dimensions', () => {
      expect(DEFAULT_VIEWPORT).toEqual({ width: 1280, height: 800 });
    });
  });

  describe('EDITOR_DIR', () => {
    it('points to editor directory', () => {
      expect(EDITOR_DIR).toContain('editor');
    });

    it('is an absolute path', () => {
      expect(path.isAbsolute(EDITOR_DIR)).toBe(true);
    });

    it('editor.js exists at expected location', () => {
      const editorJsPath = path.join(EDITOR_DIR, 'dist', 'editor.js');
      expect(existsSync(editorJsPath)).toBe(true);
    });

    it('resolves to heroshot package editor directory', () => {
      // EDITOR_DIR should be inside the heroshot package, not outside
      expect(EDITOR_DIR).toMatch(/heroshot[/\\]editor$/);
    });
  });
});
