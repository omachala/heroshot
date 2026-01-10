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
export type OnElementPickedFn = (data: ElementPickedData) => void;

/**
 * Extended Window interface with heroshot properties
 */
declare global {
  interface Window {
    __heroshotPickerInit?: boolean;
    onElementPicked?: OnElementPickedFn;
  }
}

/**
 * Picker state
 */
export interface PickerState {
  isActive: boolean;
  currentElement: Element | null;
}
