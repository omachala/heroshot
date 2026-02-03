/**
 * Event Recorder
 *
 * Records user interactions and converts them to Action objects.
 * Used for action recording in the editor toolbar.
 *
 * @see ../../src/actionSchema.ts for action type definitions
 */

import { generateSelector } from './selectorGenerator';

/**
 * Recorded action types (subset of full Action schema for recording)
 */
export type RecordedAction =
  | { type: 'click'; selector: string; doubleClick?: boolean }
  | { type: 'type'; selector: string; text: string }
  | { type: 'select_option'; selector: string; values: string[] }
  | { type: 'press_key'; key: string }
  | { type: 'hover'; selector: string };

/**
 * Callback for action events
 */
type ActionCallback = (action: RecordedAction) => void;

/**
 * Pending type action (debounced)
 */
type PendingType = {
  selector: string;
  element: Element;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Special keys that should be recorded as press_key actions
 */
const SPECIAL_KEYS = new Set([
  'Enter',
  'Escape',
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Backspace',
  'Delete',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
]);

/**
 * Debounce delay for typing (ms)
 */
const TYPE_DEBOUNCE_MS = 300;

/**
 * Event Recorder class
 */
export class EventRecorder {
  private recording = false;
  private actions: RecordedAction[] = [];
  private callbacks: ActionCallback[] = [];
  private pendingType: PendingType | null = null;

  /**
   * Start recording user interactions
   */
  startRecording(): void {
    this.recording = true;
    this.actions = [];
    this.clearPendingType();
  }

  /**
   * Stop recording and return captured actions
   */
  stopRecording(): RecordedAction[] {
    this.flushPendingType();
    this.recording = false;
    const result = [...this.actions];
    return result;
  }

  /**
   * Get current actions without stopping
   */
  getActions(): RecordedAction[] {
    return [...this.actions];
  }

  /**
   * Clear all recorded actions
   */
  clear(): void {
    this.actions = [];
    this.clearPendingType();
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording;
  }

  /**
   * Process a DOM event
   */
  processEvent(event: Event, target: Element | null): void {
    if (!this.recording || !target) return;

    // Skip heroshot UI events
    if (this.isHeroshotElement(target)) return;

    switch (event.type) {
      case 'click': {
        this.handleClick(target, false);
        break;
      }
      case 'dblclick': {
        this.handleClick(target, true);
        break;
      }
      case 'input': {
        this.handleInput(target);
        break;
      }
      case 'change': {
        this.handleChange(target);
        break;
      }
      case 'keydown': {
        if (event instanceof KeyboardEvent) {
          this.handleKeydown(event, target);
        }
        break;
      }
      case 'blur': {
        this.handleBlur(target);
        break;
      }
    }
  }

  /**
   * Subscribe to action added events
   */
  onActionAdded(callback: ActionCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index !== -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearPendingType();
    this.callbacks = [];
    this.actions = [];
    this.recording = false;
  }

  /**
   * Handle click events
   */
  private handleClick(target: Element, doubleClick: boolean): void {
    const selector = generateSelector(target);
    const action: RecordedAction = doubleClick
      ? { type: 'click', selector, doubleClick: true }
      : { type: 'click', selector };
    this.addAction(action);
  }

  /**
   * Handle input events (debounced for typing)
   */
  private handleInput(target: Element): void {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    const selector = generateSelector(target);

    // Clear existing pending type for this element
    if (this.pendingType?.selector === selector) {
      clearTimeout(this.pendingType.timer);
    }

    // Set new pending type with debounce
    this.pendingType = {
      selector,
      element: target,
      timer: setTimeout(() => this.flushPendingType(), TYPE_DEBOUNCE_MS),
    };
  }

  /**
   * Handle change events (for select elements)
   */
  private handleChange(target: Element): void {
    if (target instanceof HTMLSelectElement) {
      const selector = generateSelector(target);
      const values = [...target.selectedOptions].map(({ value }) => value);
      this.addAction({ type: 'select_option', selector, values });
    }
  }

  /**
   * Handle keydown events
   */
  private handleKeydown(event: KeyboardEvent, _target: Element): void {
    const { key, ctrlKey, altKey, shiftKey, metaKey } = event;

    // Build key combination string
    const modifiers: string[] = [];
    if (ctrlKey) modifiers.push('Control');
    if (altKey) modifiers.push('Alt');
    if (shiftKey) modifiers.push('Shift');
    if (metaKey) modifiers.push('Meta');

    // Only record special keys or key combinations with modifiers
    const hasModifier = modifiers.length > 0;
    const isSpecialKey = SPECIAL_KEYS.has(key);

    if (!isSpecialKey && !hasModifier) {
      return; // Ignore regular character keys
    }

    // For character keys with modifiers (like Ctrl+A)
    const keyString = hasModifier ? [...modifiers, key].join('+') : key;

    this.addAction({ type: 'press_key', key: keyString });
  }

  /**
   * Handle blur events (flush pending type)
   */
  private handleBlur(target: Element): void {
    if (
      this.pendingType &&
      (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
    ) {
      const pendingSelector = generateSelector(target);
      if (this.pendingType.selector === pendingSelector) {
        this.flushPendingType();
      }
    }
  }

  /**
   * Flush pending type action
   */
  private flushPendingType(): void {
    if (!this.pendingType) return;

    const { selector, element } = this.pendingType;
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const text = element.value;
      if (text) {
        this.addAction({ type: 'type', selector, text });
      }
    }

    this.clearPendingType();
  }

  /**
   * Clear pending type without flushing
   */
  private clearPendingType(): void {
    if (this.pendingType) {
      clearTimeout(this.pendingType.timer);
      this.pendingType = null;
    }
  }

  /**
   * Add action and notify callbacks
   */
  private addAction(action: RecordedAction): void {
    this.actions.push(action);
    for (const callback of this.callbacks) {
      callback(action);
    }
  }

  /**
   * Check if element is part of heroshot UI
   */
  private isHeroshotElement(element: Element): boolean {
    return element.closest('#heroshot-root') !== null;
  }
}

/**
 * Default singleton instance
 */
export const eventRecorder = new EventRecorder();
