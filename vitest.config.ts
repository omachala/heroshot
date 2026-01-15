import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      // Exclude: tests, types (no runtime code), CLI display, and integration-test files (covered by e2e)
      exclude: [
        'src/tests/**',
        'src/types.ts',
        'src/browser.ts',
        'src/cli.ts',
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
