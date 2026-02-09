import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['vitePlugin.ts', 'docusaurusPlugin.ts', 'nextPlugin.ts'],
      outDir: '../../dist/integrations/shared',
    }),
    {
      name: 'copy-virtual-dts',
      closeBundle() {
        cpSync(
          resolve(__dirname, 'virtual.d.ts'),
          resolve(__dirname, '../../dist/integrations/shared/virtual.d.ts')
        );
      },
    },
  ],
  build: {
    lib: {
      entry: {
        vitePlugin: resolve(__dirname, 'vitePlugin.ts'),
        docusaurusPlugin: resolve(__dirname, 'docusaurusPlugin.ts'),
        nextPlugin: resolve(__dirname, 'nextPlugin.ts'),
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
