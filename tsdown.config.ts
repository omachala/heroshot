import { cpSync } from 'node:fs';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'integrations/shared/configTransform.ts',
    'cli/cli': 'src/cli/cli.ts',
    'mcp/index': 'src/mcp/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  inlineOnly: false,
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
