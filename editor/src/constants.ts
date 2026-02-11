/**
 * Shared constants for the editor UI.
 *
 * Z-indices use the max 32-bit signed integer range (2^31 - 1 = 2147483647)
 * to sit above any host page content. Three layers:
 *   ANNOTATION (below) → OVERLAY (middle) → UI (top)
 */

// --- Z-Index Layers ---

/** Annotation SVG layer and text-edit hover overlays */
export const Z_INDEX_ANNOTATION = 2_147_483_645;

/** Main overlay container (dark surround, highlight) */
export const Z_INDEX_OVERLAY = 2_147_483_646;

/** Top-level UI: tooltip, editor bar, config bar, settings modal */
export const Z_INDEX_UI = 2_147_483_647;

// --- Retry / Timing ---

/** Max attempts when finding an element by selector (with retry) */
export const HIGHLIGHT_MAX_ATTEMPTS = 5;

/** Delay between highlight retry attempts (ms) */
export const HIGHLIGHT_RETRY_DELAY = 1000;

// --- Default Values ---

/** Default border color for screenshots */
export const DEFAULT_BORDER_COLOR = '#000000';

/** Text edit hover outline color (pink-500) */
export const TEXT_EDIT_HIGHLIGHT_COLOR = '#ec4899';
