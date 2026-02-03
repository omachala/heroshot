/**
 * Browser context functions for DOM manipulation.
 * These functions execute in the browser via page.evaluate(fn, ...args).
 *
 * IMPORTANT: These functions run in browser context, not Node.js.
 * They cannot access Node modules or closures - all data must be passed as arguments.
 *
 * NOTE: Most functions that need nested helpers or module-level constants have been
 * moved to use string-based evaluation in their respective wrapper files to avoid
 * tsx __name wrapper issues. Only simple functions are exported here.
 */

/// <reference lib="dom" />

/**
 * Apply or remove dark mode class on document element.
 */
export function applyColorScheme(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark);
}
