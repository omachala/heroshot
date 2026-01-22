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
  });
});
