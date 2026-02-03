/**
 * EventInterceptor - Central Event Isolation Module
 *
 * Intercepts all events at the document capture phase to:
 * 1. Block toolbar events from reaching the page
 * 2. Block page events when in picker mode (page frozen)
 * 3. Allow and record page events when in recording mode
 *
 * This solves Issue #65: toolbar clicks no longer trigger page handlers.
 *
 * @see .claude/EDITOR_ARCHITECTURE.md
 */

/**
 * Operating modes for the interceptor
 */
export type InterceptorMode = 'idle' | 'recording' | 'picker';

/**
 * Event types we intercept at capture phase (for page event blocking)
 *
 * Note: scroll/wheel events are intentionally NOT blocked - users may need to
 * scroll to find the element they want to pick. Only click/keyboard events
 * that would trigger page handlers are blocked.
 */
const CAPTURE_EVENT_TYPES: readonly string[] = [
  // Mouse events
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  // Keyboard events
  'keydown',
  'keyup',
  'keypress',
  // Form events
  'input',
  'change',
  'submit',
  // Focus events
  'focus',
  'blur',
  'focusin',
  'focusout',
];

/**
 * Event types we intercept at bubble phase on heroshot-root (to prevent reaching page)
 */
const BUBBLE_EVENT_TYPES: readonly string[] = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'keydown',
  'keyup',
  'keypress',
  'input',
  'change',
  'submit',
];

type ModeChangeCallback = (newMode: InterceptorMode, oldMode: InterceptorMode) => void;
type PageEventCallback = (event: Event) => void;

/**
 * Central event interception module
 */
export class EventInterceptor {
  private mode: InterceptorMode = 'idle';
  private initialized = false;
  private boundCaptureHandler: (event: Event) => void;
  private boundBubbleHandler: (event: Event) => void;
  private modeChangeCallbacks: ModeChangeCallback[] = [];
  private pageEventCallbacks: PageEventCallback[] = [];
  private heroshotRoot: Element | null = null;

  constructor() {
    this.boundCaptureHandler = this.handleCaptureEvent.bind(this);
    this.boundBubbleHandler = this.handleBubbleEvent.bind(this);
  }

  /**
   * Initialize the interceptor by registering event listeners
   */
  init(): void {
    if (this.initialized) return;

    // Register capture-phase listeners on document for blocking page events in picker mode
    for (const eventType of CAPTURE_EVENT_TYPES) {
      document.addEventListener(eventType, this.boundCaptureHandler, { capture: true });
    }

    this.initialized = true;

    // Wait for heroshot-root to be added, then register bubble-phase listeners
    this.waitForHeroshotRoot();
  }

  /**
   * Wait for #heroshot-root to exist and register bubble-phase listeners
   */
  private waitForHeroshotRoot(): void {
    const root = document.querySelector('#heroshot-root');
    if (root) {
      this.attachBubbleListeners(root);
      return;
    }

    // Use MutationObserver to detect when heroshot-root is added
    const observer = new MutationObserver((_mutations, obs) => {
      const heroshotRoot = document.querySelector('#heroshot-root');
      if (heroshotRoot) {
        this.attachBubbleListeners(heroshotRoot);
        obs.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Attach bubble-phase listeners to heroshot-root to prevent events from reaching page
   */
  private attachBubbleListeners(root: Element): void {
    this.heroshotRoot = root;

    for (const eventType of BUBBLE_EVENT_TYPES) {
      // Bubble phase listener on heroshot-root stops propagation before event exits
      root.addEventListener(eventType, this.boundBubbleHandler, { capture: false });
    }
  }

  /**
   * Clean up all event listeners
   */
  destroy(): void {
    if (!this.initialized) return;

    for (const eventType of CAPTURE_EVENT_TYPES) {
      document.removeEventListener(eventType, this.boundCaptureHandler, { capture: true });
    }

    if (this.heroshotRoot) {
      for (const eventType of BUBBLE_EVENT_TYPES) {
        this.heroshotRoot.removeEventListener(eventType, this.boundBubbleHandler, {
          capture: false,
        });
      }
      this.heroshotRoot = null;
    }

    this.mode = 'idle';
    this.modeChangeCallbacks = [];
    this.pageEventCallbacks = [];
    this.initialized = false;
  }

  /**
   * Get current mode
   */
  getMode(): InterceptorMode {
    return this.mode;
  }

  /**
   * Set the operating mode
   */
  setMode(newMode: InterceptorMode): void {
    if (this.mode === newMode) return;

    const oldMode = this.mode;
    this.mode = newMode;

    for (const callback of this.modeChangeCallbacks) {
      callback(newMode, oldMode);
    }
  }

  /**
   * Subscribe to mode changes
   */
  onModeChange(callback: ModeChangeCallback): () => void {
    this.modeChangeCallbacks.push(callback);
    return () => {
      const index = this.modeChangeCallbacks.indexOf(callback);
      if (index !== -1) {
        this.modeChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to page events (for recording)
   */
  onPageEvent(callback: PageEventCallback): () => void {
    this.pageEventCallbacks.push(callback);
    return () => {
      const index = this.pageEventCallbacks.indexOf(callback);
      if (index !== -1) {
        this.pageEventCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Check if an element is part of heroshot UI
   */
  isHeroshotElement(element: Element | null): boolean {
    if (!element) return false;
    // Check if inside heroshot-root or is a heroshot overlay (text edit overlays)
    return (
      element.closest('#heroshot-root') !== null ||
      (element instanceof HTMLElement && element.dataset['heroshotOverlay'] === 'true')
    );
  }

  /**
   * Capture-phase handler - handles page events based on mode
   *
   * In picker mode, we call preventDefault to stop default browser actions
   * (link navigation, form submission). ElementPicker's capture handler
   * will call stopImmediatePropagation after processing the event.
   */
  private handleCaptureEvent(event: Event): void {
    const target = event.target instanceof Element ? event.target : null;

    // Let heroshot events through - they'll be stopped by bubble handler
    if (this.isHeroshotElement(target)) {
      return;
    }

    // In picker mode, block page events (but allow scroll for navigation)
    if (this.mode === 'picker') {
      event.preventDefault();
      // ElementPicker's capture handler will call stopImmediatePropagation
      return;
    }

    // In recording mode, record the event but let it through
    if (this.mode === 'recording') {
      for (const callback of this.pageEventCallbacks) {
        callback(event);
      }
    }

    // In idle mode, let events through normally
  }

  /**
   * Bubble-phase handler - stops heroshot events from reaching page handlers
   * This runs on #heroshot-root after Svelte has processed the event
   */
  private handleBubbleEvent(event: Event): void {
    // Stop propagation so the event doesn't continue to page handlers
    event.stopPropagation();
  }
}

/**
 * Singleton instance for global use
 */
export const eventInterceptor = new EventInterceptor();
