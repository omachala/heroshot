/**
 * Unit tests for ui.ts
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as ui from '../ui';

describe('ui', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    // Reset verbose state
    ui.setVerbose(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setVerbose / isVerbose', () => {
    it('defaults to false', () => {
      expect(ui.isVerbose()).toBe(false);
    });

    it('can be enabled', () => {
      ui.setVerbose(true);
      expect(ui.isVerbose()).toBe(true);
    });

    it('can be disabled', () => {
      ui.setVerbose(true);
      ui.setVerbose(false);
      expect(ui.isVerbose()).toBe(false);
    });
  });

  describe('log', () => {
    it('outputs to console.log', () => {
      ui.log('test message');
      expect(console.log).toHaveBeenCalledWith('test message');
    });
  });

  describe('colors', () => {
    it('wraps text in ANSI codes', () => {
      expect(ui.colors.dim('test')).toContain('test');
      expect(ui.colors.dim('test')).toContain('\x1b[2m');
      expect(ui.colors.green('test')).toContain('\x1b[32m');
      expect(ui.colors.red('test')).toContain('\x1b[31m');
      expect(ui.colors.yellow('test')).toContain('\x1b[33m');
      expect(ui.colors.cyan('test')).toContain('\x1b[36m');
      expect(ui.colors.bold('test')).toContain('\x1b[1m');
    });
  });
});
