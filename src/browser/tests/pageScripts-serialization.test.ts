/**
 * Integration test for pageScripts serialization safety with tsx.
 *
 * ============================================================================
 * BACKGROUND: THE tsx vs tsup DIFFERENCE
 * ============================================================================
 *
 * When running TypeScript, different tools have different behaviors:
 *
 * - tsx (development): Adds __name() wrapper to nested function properties
 * - tsup (production build): Does NOT add __name() wrapper
 *
 * This means production npm users are unaffected, but development mode
 * (`pnpm dev`) would be broken if we used typed functions with nested
 * function properties.
 *
 * We still need this test because:
 * 1. `pnpm dev` is used constantly during development
 * 2. Dev/prod behaving differently causes confusion and bugs
 * 3. The string-based solution works for both environments
 *
 * ============================================================================
 * WHY VITEST CAN'T CATCH THIS
 * ============================================================================
 *
 * Vitest uses vite/esbuild with different settings than tsx, so it doesn't
 * add __name wrappers. Regular unit tests won't catch the issue!
 *
 * This test spawns tsx to verify the ACTUAL behavior during development.
 * ============================================================================
 */

import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { describe, expect, it, afterAll } from 'vitest';

// Use system temp directory to avoid CI issues with missing .cache folder
const TEMP_SCRIPT = path.join(os.tmpdir(), 'heroshot-test-serialization.ts');

describe('pageScripts tsx serialization', () => {
  afterAll(() => {
    try {
      unlinkSync(TEMP_SCRIPT);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  /**
   * Verify that exported functions from pageScripts.ts do NOT contain
   * __name wrappers when transpiled with tsx.
   *
   * If this test fails, someone added a function with nested function
   * properties. Such functions break page.evaluate() in development mode.
   */
  it('exported functions do not contain __name when run with tsx', { timeout: 30000 }, () => {
    // Use absolute path since temp file is outside project directory
    const pageScriptsPath = path.join(process.cwd(), 'src/browser/pageScripts.ts');

    // Write test script to file to avoid shell escaping issues
    const script = `
import {
  isHeroshotInitialized,
  updatePendingJob,
  dispatchHighlightJob
} from '${pageScriptsPath}';

const fns = { isHeroshotInitialized, updatePendingJob, dispatchHighlightJob };
const results: Record<string, { hasName: boolean; snippet: string }> = {};

for (const [name, fn] of Object.entries(fns)) {
  const str = fn.toString();
  results[name] = {
    hasName: str.includes('__name'),
    snippet: str.slice(0, 150)
  };
}

console.log(JSON.stringify(results));
`;

    writeFileSync(TEMP_SCRIPT, script);

    const output = execSync(`npx tsx ${TEMP_SCRIPT}`, {
      // NOSONAR - Safe: TEMP_SCRIPT is a constant path we control
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    const results = JSON.parse(output.trim()) as Record<
      string,
      { hasName: boolean; snippet: string }
    >;

    for (const [fnName, result] of Object.entries(results)) {
      expect(
        result.hasName,
        `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERIALIZATION ERROR: Function "${fnName}" contains __name wrapper!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When tsx transpiles this function, it adds an __name() wrapper that doesn't
exist in the browser, causing: ReferenceError: __name is not defined

Serialized output:
${result.snippet}...

CAUSE:
This function likely has a nested function property like:
  { callback: function(x) { ... } }

SOLUTION:
Functions with nested function properties cannot be exported from
pageScripts.ts. Use string-based evaluation in injectToolbar.ts instead.

See pageScripts.ts header comment for full explanation.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      ).toBe(false);
    }
  });
});
