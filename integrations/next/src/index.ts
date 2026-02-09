import { setManifest } from '../../shared/manifestStore';
import type { Manifest } from '../../shared/types';

// Auto-register manifest from withHeroshot() webpack alias
// @heroshot/manifest is resolved by webpack to the generated manifest.json
// This import stays external in the build output, webpack resolves it at bundle time
import manifestData from '@heroshot/manifest';

// Side-effect: register manifest at import time
// IIFE prevents tree-shaking from removing this call
(function () {
  setManifest(manifestData as Manifest);
})();

export { Heroshot, HeroshotProvider } from '../../react/src/components/Heroshot';
export { setManifest } from '../../shared/manifestStore';
export type { Manifest } from '../../shared/types';
