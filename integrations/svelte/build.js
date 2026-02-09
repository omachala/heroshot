/**
 * Post-build script for Svelte integration.
 *
 * 1. Copies raw .svelte component to dist (SvelteKit compiles it for SSR + client)
 * 2. Generates index.js that re-exports from the .svelte component + shared utils
 * 3. Generates index.d.ts type declarations
 *
 * The consumer's bundler (SvelteKit/Vite) compiles the .svelte file on demand,
 * producing correct SSR and client-side output.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const distDir = '../../dist/integrations/svelte';

// 1. Copy raw .svelte component with rewritten imports
const svelteSrc = readFileSync('src/components/Heroshot.svelte', 'utf-8');
const svelteOut = svelteSrc.replace(`from '../../../shared'`, `from '../shared.js'`);
mkdirSync(`${distDir}/components`, { recursive: true });
writeFileSync(`${distDir}/components/Heroshot.svelte`, svelteOut);

// 2. Generate index.js re-export
const indexJs = `// Svelte integration - re-exports component + shared utilities
// The .svelte file is compiled by the consumer's bundler (SvelteKit/Vite)
export { default as Heroshot, default } from './components/Heroshot.svelte';
export { setManifest, getManifest } from './shared.js';
`;
writeFileSync(`${distDir}/index.js`, indexJs);

// 3. Generate index.d.ts type declarations
const indexDts = `import { SvelteComponent } from 'svelte';

export interface Manifest {
  version: 1;
  outputDirectory: string;
  screenshots: Record<string, {
    slug: string;
    viewports: string[];
    colorSchemes: ('light' | 'dark')[];
    format: 'png' | 'jpeg';
  }>;
}

export interface HeroshotProps {
  name: string;
  alt?: string;
  manifest?: Manifest;
  class?: string;
}

export declare class Heroshot extends SvelteComponent<HeroshotProps> {}
export default Heroshot;

export declare function setManifest(manifest: Manifest): void;
export declare function getManifest(): Manifest | null;
`;
writeFileSync(`${distDir}/index.d.ts`, indexDts);

console.log('[svelte] Built: shared.js, index.js, index.d.ts, components/Heroshot.svelte');
