/**
 * Unit tests for logger.ts
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { log, setVerbose } from '../logger';

describe('log', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Reset verbose state
    setVerbose(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs message to console.log', () => {
    log('test message');
    expect(console.log).toHaveBeenCalledWith('test message');
  });

  it('logs multiple messages', () => {
    log('first');
    log('second');
    expect(console.log).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenNthCalledWith(1, 'first');
    expect(console.log).toHaveBeenNthCalledWith(2, 'second');
  });
});

describe('log.verbose', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    setVerbose(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not log when verbose is disabled', () => {
    log.verbose('verbose message');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('logs when verbose is enabled', () => {
    setVerbose(true);
    log.verbose('verbose message');
    expect(console.log).toHaveBeenCalledWith('verbose message');
  });

  it('respects setVerbose changes', () => {
    setVerbose(true);
    log.verbose('first');
    expect(console.log).toHaveBeenCalledTimes(1);

    setVerbose(false);
    log.verbose('second');
    expect(console.log).toHaveBeenCalledTimes(1);

    setVerbose(true);
    log.verbose('third');
    expect(console.log).toHaveBeenCalledTimes(2);
  });
});

describe('log.error', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs error to console.error', () => {
    log.error('error message');
    expect(console.error).toHaveBeenCalledWith('error message');
  });

  it('logs multiple errors', () => {
    log.error('first error');
    log.error('second error');
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});

describe('setVerbose', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setVerbose(false);
  });

  it('enables verbose logging when set to true', () => {
    setVerbose(true);
    log.verbose('test');
    expect(console.log).toHaveBeenCalled();
  });

  it('disables verbose logging when set to false', () => {
    setVerbose(true);
    setVerbose(false);
    log.verbose('test');
    expect(console.log).not.toHaveBeenCalled();
  });
});
