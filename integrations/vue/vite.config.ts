/// <reference types="vitest" />
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { heroshot } from '../shared/vitePlugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    heroshot(), // Provides empty manifest for tests
    dts({
      include: ['src/index.ts', 'src/components/**/*.vue'],
      exclude: ['src/**/*.test.ts', 'src/setupTests.ts', 'src/main.ts', 'src/App.vue'],
      outDir: '../../dist/integrations/vue',
      tsconfigPath: './tsconfig.app.json',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    outDir: '../../dist/integrations/vue',
    emptyOutDir: true,
    copyPublicDir: false,
    rollupOptions: {
      external: ['vue', 'vitepress'],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
