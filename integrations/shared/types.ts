/**
 * Shared types for heroshot framework integrations.
 */

/** Screenshot info needed by components */
export type ScreenshotInfo = {
  /** Slugified base filename (without extension) */
  slug: string;
  /** Viewport variants (empty array if none) */
  viewports: string[];
  /** Color schemes captured */
  colorSchemes: ('light' | 'dark')[];
  /** Output format */
  format: 'png' | 'jpeg';
};

/** Manifest structure (derived from config.json) */
export type Manifest = {
  /** Manifest version for compatibility */
  version: 1;
  /** Output directory relative to project root */
  outputDirectory: string;
  /** Screenshots indexed by name */
  screenshots: Record<string, ScreenshotInfo>;
};

/** Props for Heroshot component */
export type HeroshotProps = {
  /** Screenshot name (as defined in heroshot config) */
  name: string;
  /** Alt text for accessibility */
  alt?: string;
};
