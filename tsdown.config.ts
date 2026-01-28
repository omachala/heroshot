import { cpSync } from 'node:fs';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/cli/cli.ts', 'src/mcp/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  onSuccess: async () => {
    // Copy template files to dist
    cpSync('src/templates', 'dist/templates', { recursive: true });
  },
});
