/**
 * Data passed when an element is picked
 */
export interface ElementPickedData {
  url: string;
  selector: string;
}

/**
 * Callback function exposed by Playwright
 */
export type OnElementPickedFunction = (data: ElementPickedData) => void;

/**
 * Extended Window/globalThis interface with heroshot properties
 */
declare global {
  var __heroshotPickerInit: boolean | undefined;
  var onElementPicked: OnElementPickedFunction | undefined;
}

/**
 * Picker state
 */
export interface PickerState {
  isActive: boolean;
  currentElement: Element | null;
}
