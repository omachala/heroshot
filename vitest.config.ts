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
        'src/browser/browser.ts', // integration code, tested via e2e tests
        'src/browser/injectToolbar.ts', // browser integration, tested via e2e tests
        'src/browser/launchBrowser.ts', // browser integration, tested via e2e tests
        'src/browser/saveCurrentConfig.ts', // browser integration, tested via e2e tests
        'src/browser/types.ts', // type definitions only
        'src/cli/cli.ts', // thin commander wrapper, tested via CLI integration tests
        'src/mcp/index.ts', // MCP server entry point, tested via CLI integration tests
        'src/cli/handlers.ts', // async orchestration, tested via CLI integration tests
        'src/cli/types.ts', // type definitions only
        'src/sync/browserFunctions.ts', // browser context functions, tested via e2e tests
        'src/sync/capture.ts', // capture integration, tested via e2e tests
        'src/sync/parallelCapture.ts', // parallel capture integration, tested via e2e tests
        'src/sync/configHelpers.ts', // config helpers, tested via CLI tests
        'src/sync/elementCapture.ts', // element capture, tested via e2e tests
        'src/sync/elementFinder.ts', // element finding, tested via e2e tests
        'src/sync/paddingMask.ts', // padding mask, tested via e2e tests
        'src/sync/pageScripts.ts', // browser context scripts, tested via e2e tests
        'src/sync/results.ts', // result display, mostly UI code, tested via CLI tests
        'src/sync/schemeCapture.ts', // scheme capture, tested via e2e tests
        'src/sync/screenshot.ts', // screenshot capture, tested via e2e tests
        'src/sync/sessionLoader.ts', // session loading, tested via e2e tests
        'src/sync/staleFiles.ts', // stale file handling, tested via e2e tests
        'src/sync/sync.ts', // integration code, tested via e2e tests
        'src/sync/types.ts', // type definitions only
        'src/ui.ts', // console UI utilities
      ],
      thresholds: {
        lines: 90,
      },
    },
  },
});
