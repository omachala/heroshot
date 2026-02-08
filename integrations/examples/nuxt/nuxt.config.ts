import { heroshot } from 'heroshot/plugins/vite';

export default defineNuxtConfig({
  vite: {
    plugins: [heroshot()],
  },
});
