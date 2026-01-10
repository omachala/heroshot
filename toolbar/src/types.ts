/**
 * Screenshot item stored in the toolbar
 */
export interface ScreenshotItem {
  id: string;
  name: string;
  url: string;
  selector: string;
}

/**
 * Data passed when a screenshot is added
 */
export interface ScreenshotAddedData {
  id: string;
  name: string;
  url: string;
  selector: string;
}

/**
 * Callback function types
 */
export type OnScreenshotAddedFunction = (data: ScreenshotAddedData) => void;
export type OnScreenshotRemovedFunction = (id: string) => void;
export type OnDoneFunction = () => void;

/**
 * Global heroshot namespace
 */
export interface HeroshotGlobal {
  initialized: boolean;
  screenshots: ScreenshotItem[];
  onScreenshotAdded?: OnScreenshotAddedFunction;
  onScreenshotRemoved?: OnScreenshotRemovedFunction;
  onDone?: OnDoneFunction;
}

/**
 * Extended globalThis interface
 */
declare global {
  var __heroshot: HeroshotGlobal | undefined;
}

/**
 * Toolbar state
 */
export interface ToolbarState {
  isPickerActive: boolean;
  currentElement: Element | null;
  screenshots: ScreenshotItem[];
  pendingPick: { url: string; selector: string } | null;
}
