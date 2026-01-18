// Browser-safe exports (used by components)
export type { Manifest, ScreenshotInfo, HeroshotProps } from './types';
export {
  getScreenshot,
  generateFilename,
  generatePath,
  getVariantPaths,
  type VariantPaths,
} from './paths';
export { getManifest, setManifest } from './manifestStore';

// Note: vitePlugin, docusaurusPlugin, getManifest (file loader) are exported
// separately for Node.js usage - they use Node.js APIs
