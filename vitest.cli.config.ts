/**
 * CLI integration tests - spawns actual CLI processes and captures screenshots.
 * Slow (~30s) compared to unit tests. Run separately via `pnpm test:cli`.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/tests/cli/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
  },
});
