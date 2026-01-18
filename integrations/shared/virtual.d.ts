/**
 * Type declarations for heroshot virtual modules.
 *
 * Users should add this to their project's tsconfig.json:
 * {
 *   "compilerOptions": {
 *     "types": ["heroshot/virtual"]
 *   }
 * }
 */

declare module 'virtual:heroshot-manifest' {
  import type { Manifest } from 'heroshot/vue';
  const manifest: Manifest;
  export default manifest;
}

// Docusaurus plugin alias
declare module '@heroshot/manifest' {
  import type { Manifest } from 'heroshot/docusaurus';
  const manifest: Manifest;
  export default manifest;
}
