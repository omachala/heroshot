/**
 * Tests for pageScripts string-based evaluation.
 *
 * Functions passed to page.evaluate() are serialized as strings.
 * To avoid tsx __name wrapper issues, complex functions with nested helpers
 * must use string-based evaluation in pageScripts.ts.
 */

import { describe, expect, it } from 'vitest';
import { applyColorScheme } from '../browserFunctions';

describe('browserFunctions serialization', () => {
  /**
   * Check if a serialized function references __name which would break in browser.
   */
  function hasNameWrapper(fn: Function): boolean {
    return fn.toString().includes('__name');
  }

  it('applyColorScheme has no __name wrapper (safe for page.evaluate)', () => {
    expect(
      hasNameWrapper(applyColorScheme),
      'applyColorScheme should not contain __name wrapper'
    ).toBe(false);
  });
});

describe('pageScripts string evaluation', () => {
  it('pageScripts exports string-based functions for complex operations', async () => {
    // Import the module to verify it exports correctly
    const pageScripts = await import('../pageScripts');

    // These functions should exist and be async (they use page.evaluate with strings)
    expect(typeof pageScripts.applyElementBackground).toBe('function');
    expect(typeof pageScripts.restoreElementBackground).toBe('function');
    expect(typeof pageScripts.applyTextOverrides).toBe('function');
    expect(typeof pageScripts.getElementBackgroundColor).toBe('function');
    expect(typeof pageScripts.applyColorSchemeClass).toBe('function');
  });
});
