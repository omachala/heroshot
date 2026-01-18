import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['vitePlugin.ts', 'docusaurusPlugin.ts'],
      outDir: '../../dist/integrations/shared',
    }),
  ],
  build: {
    lib: {
      entry: {
        vitePlugin: resolve(__dirname, 'vitePlugin.ts'),
        docusaurusPlugin: resolve(__dirname, 'docusaurusPlugin.ts'),
      },
      formats: ['es', 'cjs'],
    },
    outDir: '../../dist/integrations/shared',
    emptyOutDir: true,
    rollupOptions: {
      external: ['node:fs', 'node:path', 'vite'],
    },
  },
});
