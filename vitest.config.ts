import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      exclude: ['src/index.ts', 'src/types.ts', 'vitest.config.ts', 'eslint.config.js', 'dist/**'],
      thresholds: {
        lines: 90,
      },
    },
  },
});
