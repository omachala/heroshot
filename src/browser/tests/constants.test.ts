import { describe, expect, it } from 'vitest';
import { BROWSER_CHANNELS, DEFAULT_VIEWPORT, EDITOR_DIR } from '../constants';

describe('constants', () => {
  describe('DEFAULT_VIEWPORT', () => {
    it('has expected dimensions', () => {
      expect(DEFAULT_VIEWPORT).toEqual({ width: 1280, height: 800 });
    });
  });

  describe('BROWSER_CHANNELS', () => {
    it('prefers chrome over chromium', () => {
      expect(BROWSER_CHANNELS[0]).toBe('chrome');
      expect(BROWSER_CHANNELS[1]).toBe('chromium');
    });

    it('has exactly 2 channels', () => {
      expect(BROWSER_CHANNELS).toHaveLength(2);
    });
  });

  describe('EDITOR_DIR', () => {
    it('points to editor directory', () => {
      expect(EDITOR_DIR).toContain('editor');
    });
  });
});
