/**
 * Manifest store for heroshot framework integrations.
 * Allows the Vite plugin to register the manifest globally.
 */
import type { Manifest } from './types';

// Global manifest store
let globalManifest: Manifest | null = null;

/**
 * Set the global manifest (called by the Vite plugin)
 */
export function setManifest(manifest: Manifest): void {
  globalManifest = manifest;
}

/**
 * Get the global manifest
 */
export function getManifest(): Manifest | null {
  return globalManifest;
}
