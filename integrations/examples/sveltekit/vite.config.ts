import { sveltekit } from '@sveltejs/kit/vite';
import { heroshot } from 'heroshot/plugins/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), heroshot()],
});
