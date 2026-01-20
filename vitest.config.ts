import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', 'src/tests/cli/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      // Exclude: tests, types (no runtime code), CLI entry/display, and integration-test files (covered by e2e/cli tests)
      exclude: [
        'src/**/*.test.ts',
        'src/tests/**',
        'src/types.ts',
        'src/browser.ts', // integration code, tested via e2e tests
        'src/cli/cli.ts', // thin commander wrapper, tested via CLI integration tests
        'src/cli/handlers.ts', // async orchestration, tested via CLI integration tests
        'src/cli/types.ts', // type definitions only
        'src/sync.ts',
        'src/ui.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
