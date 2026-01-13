import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // Only cover pure logic files - browser/sync/cli have heavy side effects
      include: ['src/schema.ts', 'src/config.ts', 'src/configFile.ts', 'src/logger.ts'],
      exclude: ['src/tests/**'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
