import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  useCurrentFrame,
  AbsoluteFill,
  staticFile,
  continueRender,
  delayRender,
  interpolate,
  Easing,
  getRemotionEnvironment,
} from 'remotion';
import { Cursor } from './Cursor';
import { Terminal } from './Terminal';

type Position = { x: number; y: number };

// =============================================================================
// SCENE-BASED TIMELINE - each scene starts when previous ends
// =============================================================================

// Scene durations (in frames, 30fps)
// CORRECT ORDER: click element → type name → drag corner → configbar styling → annotate → done
const SCENE = {
  EMPTY_DESKTOP: 15, // 0.5s - empty wallpaper
  TERMINAL_OPEN: 15, // 0.5s - terminal animates in
  TERMINAL_TYPE: 30, // 1s - typing "npx heroshot"
  WAIT_AFTER_TYPE: 9, // 0.3s - pause before browser
  BROWSER_OPEN: 15, // 0.5s - browser animates in with welcome page
  CURSOR_TO_ADDRESS: 10, // cursor moves to address bar
  ADDRESS_FOCUS: 15, // address bar focused
  ADDRESS_TYPE: 20, // typing new URL
  PAGE_LOAD: 5, // brief load
  PAGE_READY: 30, // page visible
  CURSOR_TO_PICKER: 15, // cursor moves to picker
  CLICK_PICKER: 30, // picker clicked, wait for mode
  CURSOR_TO_ELEMENT: 20, // cursor moves to element
  CLICK_ELEMENT: 15, // element clicked, selection appears
  TYPE_NAME: 45, // type "Demo" - CURSOR IDLE during this
  CURSOR_TO_CORNER: 20, // cursor moves to bottom-right corner
  DRAG_CORNER: 40, // drag to expand selection (adds white padding)
  CURSOR_TO_PADDING_FILL: 12, // cursor moves to padding fill dropdown
  CLICK_PADDING_FILL: 12, // click dropdown, set "solid", pause
  CURSOR_TO_BORDER_COLOR: 12, // cursor moves to border color input
  CLICK_BORDER_COLOR: 12, // click, set color (#818cf8), pause
  CURSOR_TO_BORDER_WIDTH: 12, // cursor moves to border width input
  ANIMATE_BORDER_WIDTH: 15, // animate from 0 to 3 over 0.5s
  CURSOR_TO_BORDER_RADIUS: 12, // cursor moves to border radius input
  ANIMATE_BORDER_RADIUS: 15, // animate from 0 to 12 over 0.5s
  CONFIGBAR_SETTLE: 15, // pause — viewer sees styled element
  CURSOR_TO_ANNOTATE: 15, // cursor moves to Annotate button
  CLICK_ANNOTATE: 15, // click Annotate, crosshair cursor activates
  CURSOR_TO_ARROW_START: 15, // cursor moves to arrow start position
  DRAW_ARROW: 35, // draw arrow (linear drag)
  ANNOTATION_SETTLE: 10, // pause — annotation ConfigBar appears
  CURSOR_TO_STROKE_COLOR: 12, // cursor moves to stroke color input
  SET_STROKE_COLOR: 10, // set stroke color, pause
  CURSOR_TO_STROKE_WIDTH: 12, // cursor moves to stroke-width input
  ANIMATE_STROKE_WIDTH: 15, // animate stroke-width 3 → 8
  CURSOR_TO_DESELECT: 15, // cursor moves to element area
  CLICK_DESELECT: 10, // click element to deselect annotation
  FINAL_SETTLE: 30, // 1s — viewer sees final result
  CURSOR_TO_DONE: 20, // cursor moves to Done button
  CLICK_DONE: 10, // click Done button
  BROWSER_CLOSE: 5, // browser closes
  TERMINAL_OUTPUT: 150, // 5s - show output and hold for reading
};

// Calculate scene start frames (cumulative) - impossible to overlap
let _frame = 0;
const SCENE_START = {
  EMPTY_DESKTOP: _frame,
  TERMINAL_OPEN: (_frame += SCENE.EMPTY_DESKTOP),
  TERMINAL_TYPE: (_frame += SCENE.TERMINAL_OPEN),
  WAIT_AFTER_TYPE: (_frame += SCENE.TERMINAL_TYPE),
  BROWSER_OPEN: (_frame += SCENE.WAIT_AFTER_TYPE),
  CURSOR_TO_ADDRESS: (_frame += SCENE.BROWSER_OPEN),
  ADDRESS_FOCUS: (_frame += SCENE.CURSOR_TO_ADDRESS),
  ADDRESS_TYPE: (_frame += SCENE.ADDRESS_FOCUS),
  PAGE_LOAD: (_frame += SCENE.ADDRESS_TYPE),
  PAGE_READY: (_frame += SCENE.PAGE_LOAD),
  CURSOR_TO_PICKER: (_frame += SCENE.PAGE_READY),
  CLICK_PICKER: (_frame += SCENE.CURSOR_TO_PICKER),
  CURSOR_TO_ELEMENT: (_frame += SCENE.CLICK_PICKER),
  CLICK_ELEMENT: (_frame += SCENE.CURSOR_TO_ELEMENT),
  TYPE_NAME: (_frame += SCENE.CLICK_ELEMENT),
  CURSOR_TO_CORNER: (_frame += SCENE.TYPE_NAME),
  DRAG_CORNER: (_frame += SCENE.CURSOR_TO_CORNER),
  CURSOR_TO_PADDING_FILL: (_frame += SCENE.DRAG_CORNER),
  CLICK_PADDING_FILL: (_frame += SCENE.CURSOR_TO_PADDING_FILL),
  CURSOR_TO_BORDER_COLOR: (_frame += SCENE.CLICK_PADDING_FILL),
  CLICK_BORDER_COLOR: (_frame += SCENE.CURSOR_TO_BORDER_COLOR),
  CURSOR_TO_BORDER_WIDTH: (_frame += SCENE.CLICK_BORDER_COLOR),
  ANIMATE_BORDER_WIDTH: (_frame += SCENE.CURSOR_TO_BORDER_WIDTH),
  CURSOR_TO_BORDER_RADIUS: (_frame += SCENE.ANIMATE_BORDER_WIDTH),
  ANIMATE_BORDER_RADIUS: (_frame += SCENE.CURSOR_TO_BORDER_RADIUS),
  CONFIGBAR_SETTLE: (_frame += SCENE.ANIMATE_BORDER_RADIUS),
  CURSOR_TO_ANNOTATE: (_frame += SCENE.CONFIGBAR_SETTLE),
  CLICK_ANNOTATE: (_frame += SCENE.CURSOR_TO_ANNOTATE),
  CURSOR_TO_ARROW_START: (_frame += SCENE.CLICK_ANNOTATE),
  DRAW_ARROW: (_frame += SCENE.CURSOR_TO_ARROW_START),
  ANNOTATION_SETTLE: (_frame += SCENE.DRAW_ARROW),
  CURSOR_TO_STROKE_COLOR: (_frame += SCENE.ANNOTATION_SETTLE),
  SET_STROKE_COLOR: (_frame += SCENE.CURSOR_TO_STROKE_COLOR),
  CURSOR_TO_STROKE_WIDTH: (_frame += SCENE.SET_STROKE_COLOR),
  ANIMATE_STROKE_WIDTH: (_frame += SCENE.CURSOR_TO_STROKE_WIDTH),
  CURSOR_TO_DESELECT: (_frame += SCENE.ANIMATE_STROKE_WIDTH),
  CLICK_DESELECT: (_frame += SCENE.CURSOR_TO_DESELECT),
  FINAL_SETTLE: (_frame += SCENE.CLICK_DESELECT),
  CURSOR_TO_DONE: (_frame += SCENE.FINAL_SETTLE),
  CLICK_DONE: (_frame += SCENE.CURSOR_TO_DONE),
  BROWSER_CLOSE: (_frame += SCENE.CLICK_DONE),
  TERMINAL_OUTPUT: (_frame += SCENE.BROWSER_CLOSE),
  END: (_frame += SCENE.TERMINAL_OUTPUT),
};

// Derived constants for backward compatibility
const TERMINAL_OPEN_START = SCENE_START.TERMINAL_OPEN;
const TERMINAL_OPEN_END = SCENE_START.TERMINAL_TYPE;
const TERMINAL_TYPE_START = SCENE_START.TERMINAL_TYPE;
const TERMINAL_TYPE_END = SCENE_START.WAIT_AFTER_TYPE;
const BROWSER_OPEN_START = SCENE_START.BROWSER_OPEN;
const BROWSER_OPEN_END = SCENE_START.CURSOR_TO_ADDRESS;
const ADDRESS_CLICK_FRAME = SCENE_START.ADDRESS_FOCUS;
const ADDRESS_TYPE_START = SCENE_START.ADDRESS_TYPE;
const ADDRESS_TYPE_END = SCENE_START.PAGE_LOAD;
const PAGE_LOAD_FRAME = SCENE_START.PAGE_LOAD;
const BROWSER_CLOSE_FRAME = SCENE_START.BROWSER_CLOSE;
const TERMINAL_OUTPUT_START = SCENE_START.TERMINAL_OUTPUT;
const TOTAL_FRAMES = SCENE_START.END;

// Browser chrome header height (10px padding + ~28px content + 10px padding = 48px)
const BROWSER_HEADER_HEIGHT = 48;

// Address bar position
const ADDRESS_BAR_X = 500; // Middle of address bar
const ADDRESS_BAR_Y = 61; // Middle of address bar (40 + 21)

// Fallback positions for rendering mode only (iframe doesn't work in SSR)
// Re-measure from preview if layout changes
const FALLBACK_POSITIONS = {
  pickerButton: { x: 1003, y: 40 },
  featureCard: { x: 700, y: 305 },
  featureCardCorner: { x: 910, y: 485 },
  annotateButton: { x: 1003, y: 120 },
  arrowStart: { x: 800, y: 435 },
  arrowEnd: { x: 700, y: 335 },
  doneButton: { x: 1086, y: 40 },
  start: { x: 700, y: 363 },
};

export const HeroDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isRendering = getRemotionEnvironment().isRendering;

  // Only use delayRender in preview mode, not during actual rendering
  const [handle] = useState(() =>
    isRendering ? null : delayRender('Waiting for element positions')
  );

  // Use ref for immediate access, state for triggering re-renders
  // In rendering mode, use fallback positions immediately
  const positionsRef = useRef<{
    pickerButton: Position | null;
    featureCard: Position | null;
    featureCardCorner: Position | null;
    annotateButton: Position | null;
    paddingFillSelect: Position | null;
    borderColorInput: Position | null;
    borderWidthInput: Position | null;
    borderRadiusInput: Position | null;
    arrowStart: Position | null;
    arrowEnd: Position | null;
    strokeColorInput: Position | null;
    strokeWidthInput: Position | null;
    doneButton: Position | null;
    start: Position | null;
  }>(
    isRendering
      ? {
          ...FALLBACK_POSITIONS,
          paddingFillSelect: null,
          borderColorInput: null,
          borderWidthInput: null,
          borderRadiusInput: null,
          strokeColorInput: null,
          strokeWidthInput: null,
        }
      : {
          pickerButton: null,
          featureCard: null,
          featureCardCorner: null,
          annotateButton: null,
          paddingFillSelect: null,
          borderColorInput: null,
          borderWidthInput: null,
          borderRadiusInput: null,
          arrowStart: null,
          arrowEnd: null,
          strokeColorInput: null,
          strokeWidthInput: null,
          doneButton: null,
          start: null,
        }
  );
  const [, setPositions] = useState(positionsRef.current);
  const [resizeHandlePos, setResizeHandlePos] = useState<Position | null>(null);
  const lastClickFrame = useRef<number>(-1);
  const editorUrl = staticFile('editor.js');
  const wallpaperUrl = staticFile('tahoe-wallpaper.jpg');
  const logoUrl = staticFile('logo.svg');

  // Memoize srcDoc to prevent iframe reloads on every frame
  const iframeSrcDoc = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; background: #f0f4f8; min-height: 100vh; }
    .welcome-page { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; z-index: 10; opacity: 1; transition: opacity 0.15s; }
    .welcome-page.hidden { z-index: -1; opacity: 0; }
    .heroshot-logo { display: flex; align-items: center; justify-content: center; }
    .heroshot-logo img { width: 200px; height: 200px; }
    .page-content { display: block; }
    .nav { background: white; padding: 12px 32px; display: flex; align-items: center; gap: 24px; border-bottom: 1px solid #e2e8f0; }
    .logo { width: 100px; height: 28px; background: #e2e8f0; border-radius: 4px; }
    .nav-items { display: flex; gap: 20px; margin-left: 40px; }
    .nav-item { width: 50px; height: 10px; background: #cbd5e1; border-radius: 3px; }
    .nav-right { margin-left: auto; display: flex; gap: 12px; align-items: center; }
    .nav-icon { width: 28px; height: 28px; background: #e2e8f0; border-radius: 50%; }
    .main { display: flex; min-height: calc(100vh - 53px); }
    .sidebar { width: 200px; background: white; border-right: 1px solid #e2e8f0; padding: 20px 16px; }
    .sidebar-item { height: 10px; background: #cbd5e1; border-radius: 3px; margin-bottom: 16px; }
    .sidebar-item.active { background: #94a3b8; }
    .content { flex: 1; padding: 32px 40px; display: flex; flex-direction: column; align-items: center; }
    .feature-card { background: white; border-radius: 16px; padding: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.08); width: 420px; overflow: hidden; margin-top: 40px; }
    .feature-image { width: 100%; height: 180px; background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 50%, #818cf8 100%); display: flex; align-items: center; justify-content: center; }
    .feature-image-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.3); border-radius: 12px; }
    .feature-body { padding: 24px; }
    .feature-title { width: 65%; height: 18px; background: #64748b; border-radius: 4px; margin-bottom: 16px; }
    .feature-line { height: 10px; background: #cbd5e1; border-radius: 3px; margin-bottom: 8px; }
    .feature-btn { width: 100px; height: 36px; background: #818cf8; border-radius: 6px; margin-top: 16px; }
    .small-cards { display: flex; gap: 16px; margin-top: 32px; }
    .small-card { background: white; border-radius: 10px; padding: 16px; width: 180px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .small-card-icon { width: 32px; height: 32px; background: #e0e7ff; border-radius: 6px; margin-bottom: 12px; }
    .small-card-title { width: 70%; height: 10px; background: #94a3b8; border-radius: 3px; margin-bottom: 8px; }
    .small-card-line { height: 8px; background: #e2e8f0; border-radius: 2px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="welcome-page">
    <div class="heroshot-logo">
      <img src="${logoUrl}" alt="Heroshot" />
    </div>
  </div>
  <div class="page-content">
    <nav class="nav">
      <div class="logo"></div>
      <div class="nav-items">
        <div class="nav-item"></div>
        <div class="nav-item" style="width:60px"></div>
        <div class="nav-item" style="width:45px"></div>
      </div>
      <div class="nav-right">
        <div class="nav-icon"></div>
        <div class="nav-icon"></div>
      </div>
    </nav>
    <div class="main">
      <aside class="sidebar">
        <div class="sidebar-item active" style="width:80%"></div>
        <div class="sidebar-item" style="width:65%"></div>
        <div class="sidebar-item" style="width:75%"></div>
        <div class="sidebar-item" style="width:55%"></div>
        <div style="height:20px"></div>
        <div class="sidebar-item" style="width:70%"></div>
        <div class="sidebar-item" style="width:60%"></div>
      </aside>
      <main class="content">
        <div class="feature-card">
          <div class="feature-image">
            <div class="feature-image-icon"></div>
          </div>
          <div class="feature-body">
            <div class="feature-title"></div>
            <div class="feature-line" style="width:95%"></div>
            <div class="feature-line" style="width:85%"></div>
            <div class="feature-line" style="width:70%"></div>
            <div class="feature-btn"></div>
          </div>
        </div>
        <div class="small-cards">
          <div class="small-card">
            <div class="small-card-icon"></div>
            <div class="small-card-title"></div>
            <div class="small-card-line"></div>
            <div class="small-card-line" style="width:80%"></div>
          </div>
          <div class="small-card">
            <div class="small-card-icon"></div>
            <div class="small-card-title"></div>
            <div class="small-card-line"></div>
            <div class="small-card-line" style="width:75%"></div>
          </div>
          <div class="small-card">
            <div class="small-card-icon"></div>
            <div class="small-card-title"></div>
            <div class="small-card-line"></div>
            <div class="small-card-line" style="width:85%"></div>
          </div>
        </div>
      </main>
    </div>
  </div>
  <script>
    window.__heroshot = {
      initialized: false,
      screenshots: [],
      settings: { viewport: { width: 1200, height: 672 } },
      pendingJob: null,
      selectedId: null,
      sidebarVisible: true,
      emit: (event) => console.log('Heroshot:', event)
    };
  </script>
  <script src="${editorUrl}"></script>
</body>
</html>`,
    [editorUrl, logoUrl]
  );

  // Terminal visibility and animation
  const terminalOpacity = interpolate(
    frame,
    [
      TERMINAL_OPEN_START,
      TERMINAL_OPEN_START + 5,
      BROWSER_OPEN_START - 5,
      BROWSER_OPEN_START,
      BROWSER_CLOSE_FRAME,
      BROWSER_CLOSE_FRAME + 5,
    ],
    [0, 1, 1, 0, 0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const terminalScale = interpolate(
    frame,
    [TERMINAL_OPEN_START, TERMINAL_OPEN_START + 10, TERMINAL_OPEN_END],
    [0.8, 1.02, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  // Browser visibility - instant close on BROWSER_CLOSE_FRAME
  const browserOpacity =
    frame >= BROWSER_OPEN_START && frame < BROWSER_CLOSE_FRAME
      ? interpolate(frame, [BROWSER_OPEN_START, BROWSER_OPEN_START + 5], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;

  const browserScale = interpolate(
    frame,
    [BROWSER_OPEN_START, BROWSER_OPEN_START + 10, BROWSER_OPEN_END],
    [0.8, 1.02, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
  );

  // Address bar states
  const initialAddress = 'heroshot.sh/welcome';
  const newAddress = 'mysaas.com';
  const addressClicked = frame >= ADDRESS_CLICK_FRAME;
  const addressTyping = frame >= ADDRESS_TYPE_START && frame < PAGE_LOAD_FRAME;
  const addressProgress = interpolate(frame, [ADDRESS_TYPE_START, ADDRESS_TYPE_END], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Determine what to show in address bar
  let addressDisplay = initialAddress;
  let addressSelected = false;
  if (addressClicked && frame < ADDRESS_TYPE_START) {
    addressDisplay = initialAddress;
    addressSelected = true;
  } else if (addressTyping) {
    addressDisplay = newAddress.slice(0, Math.floor(addressProgress * newAddress.length));
  } else if (frame >= PAGE_LOAD_FRAME) {
    addressDisplay = newAddress;
  }

  // Page content visibility
  const showDocsPage = frame >= PAGE_LOAD_FRAME;

  // Terminal output lines
  const terminalOutput = [
    '┌  heroshot v0.13.0',
    '│',
    '●  Detected browsers: Google Chrome',
    '●  Launching browser...',
    '│',
    '●  Capturing: Demo (desktop-light)',
    '│  ↳ 1 annotation',
    '✓  Saved: demo-desktop-light.png',
    '│',
    '●  Capturing: Demo (desktop-dark)',
    '│  ↳ 1 annotation',
    '✓  Saved: demo-desktop-dark.png',
    '│',
    '◇  Screenshots captured',
    '│',
    '└  2 saved',
  ];

  // Helper functions

  // Get the actual resize handle position (bottom-right handle with nwse-resize cursor)
  const getResizeHandlePosition = useCallback((): Position | null => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !iframe?.contentWindow) return null;
    const heroshotRoot = iframe.contentDocument.getElementById('heroshot-root');
    const shadowRoot = heroshotRoot?.shadowRoot;
    if (!shadowRoot) return null;

    const themeWrapper = shadowRoot.querySelector('div[data-theme]');
    const handles = (themeWrapper || shadowRoot).querySelectorAll('[role="button"]');

    let bottomRightHandle: Element | null = null;
    let maxPosition = -Infinity;

    for (const handle of handles) {
      const style = iframe.contentWindow.getComputedStyle(handle);
      if (style.cursor === 'nwse-resize') {
        const rect = handle.getBoundingClientRect();
        const position = rect.top + rect.left;
        if (position > maxPosition) {
          maxPosition = position;
          bottomRightHandle = handle;
        }
      }
    }

    if (!bottomRightHandle) return null;
    const rect = bottomRightHandle.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, []);

  /** Query an element inside the iframe, optionally in the heroshot shadow DOM */
  const queryIframeElement = useCallback((selector: string, inShadow: boolean): Element | null => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return null;
    if (!inShadow) return iframe.contentDocument.querySelector(selector);
    const heroshotRoot = iframe.contentDocument.getElementById('heroshot-root');
    const shadowRoot = heroshotRoot?.shadowRoot;
    if (!shadowRoot) return null;
    const themeWrapper = shadowRoot.querySelector('div[data-theme]');
    return themeWrapper?.querySelector(selector) || shadowRoot.querySelector(selector);
  }, []);

  const getElementCorner = useCallback(
    (
      selector: string,
      inShadow: boolean,
      corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    ): Position | null => {
      const element = queryIframeElement(selector, inShadow);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      switch (corner) {
        case 'top-left':
          return { x: rect.left, y: rect.top };
        case 'top-right':
          return { x: rect.right, y: rect.top };
        case 'bottom-left':
          return { x: rect.left, y: rect.bottom };
        case 'bottom-right':
          return { x: rect.right, y: rect.bottom };
      }
    },
    [queryIframeElement]
  );

  const getElementCenter = useCallback(
    (selector: string, inShadow: boolean): Position | null => {
      const element = queryIframeElement(selector, inShadow);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    },
    [queryIframeElement]
  );

  const typeText = useCallback((text: string, thenEnter: boolean = false) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !iframe?.contentWindow) return;
    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    const heroshotRoot = doc.getElementById('heroshot-root');
    const shadowRoot = heroshotRoot?.shadowRoot;
    if (!shadowRoot) return;
    // Try multiple selectors to find the input
    let input = shadowRoot.querySelector('input[type="text"]') as HTMLInputElement;
    if (!input) {
      input = shadowRoot.querySelector('input') as HTMLInputElement;
    }
    if (!input) {
      const themeWrapper = shadowRoot.querySelector('div[data-theme]');
      input = themeWrapper?.querySelector('input') as HTMLInputElement;
    }
    if (!input) return;
    input.focus();
    input.select();
    input.value = '';
    input.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContentBackward',
      })
    );
    let delay = 50;
    const charDelay = 80;
    for (const char of text) {
      setTimeout(() => {
        input.focus();
        const keyEventInit = {
          key: char,
          code: `Key${char.toUpperCase()}`,
          bubbles: true,
          cancelable: true,
          composed: true,
          view: win,
        };
        input.dispatchEvent(new KeyboardEvent('keydown', keyEventInit));
        input.dispatchEvent(new KeyboardEvent('keypress', keyEventInit));
        input.value += char;
        input.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            cancelable: true,
            data: char,
            inputType: 'insertText',
          })
        );
        input.dispatchEvent(new KeyboardEvent('keyup', keyEventInit));
      }, delay);
      delay += charDelay;
    }
    if (thenEnter) {
      setTimeout(() => {
        input.focus();
        const enterEventInit = {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
          cancelable: true,
          composed: true,
          view: win,
        };
        input.dispatchEvent(new KeyboardEvent('keydown', enterEventInit));
        input.dispatchEvent(new KeyboardEvent('keypress', enterEventInit));
        input.dispatchEvent(new KeyboardEvent('keyup', enterEventInit));
      }, delay + 100);
    }
  }, []);

  // Track drag state for frame-synchronized dragging
  const dragState = useRef<{
    active: boolean;
    handleX: number;
    handleY: number;
    deltaX: number;
    deltaY: number;
    startFrame: number;
    endFrame: number;
  } | null>(null);

  const startDrag = useCallback(
    (deltaX: number, deltaY: number, startFrame: number, endFrame: number) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentDocument || !iframe?.contentWindow) return;
      const win = iframe.contentWindow;
      const heroshotRoot = iframe.contentDocument.getElementById('heroshot-root');
      const shadowRoot = heroshotRoot?.shadowRoot;
      if (!shadowRoot) return;
      const themeWrapper = shadowRoot.querySelector('div[data-theme]');
      const handles = (themeWrapper || shadowRoot).querySelectorAll('[role="button"]');
      let bottomRightHandle: Element | null = null;
      let maxPosition = -Infinity;
      for (const handle of handles) {
        const style = win.getComputedStyle(handle);
        if (style.cursor === 'nwse-resize') {
          const rect = handle.getBoundingClientRect();
          const position = rect.top + rect.left;
          if (position > maxPosition) {
            maxPosition = position;
            bottomRightHandle = handle;
          }
        }
      }
      if (!bottomRightHandle) return;
      const handleRect = bottomRightHandle.getBoundingClientRect();
      const handleX = handleRect.left + handleRect.width / 2;
      const handleY = handleRect.top + handleRect.height / 2;

      // Start the drag
      const eventBase = { bubbles: true, cancelable: true, composed: true, view: win, button: 0 };
      const downEvent = new MouseEvent('mousedown', {
        ...eventBase,
        clientX: handleX,
        clientY: handleY,
        buttons: 1,
      });
      bottomRightHandle.dispatchEvent(downEvent);

      // Store drag state for frame-by-frame updates
      dragState.current = { active: true, handleX, handleY, deltaX, deltaY, startFrame, endFrame };
    },
    []
  );

  const updateDrag = useCallback((progress: number) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !dragState.current) return;
    const win = iframe.contentWindow;
    const { handleX, handleY, deltaX, deltaY } = dragState.current;
    const currentX = handleX + deltaX * progress;
    const currentY = handleY + deltaY * progress;
    const moveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      view: win,
      clientX: currentX,
      clientY: currentY,
      buttons: 1,
      button: 0,
    });
    win.dispatchEvent(moveEvent);
  }, []);

  const endDrag = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !dragState.current) return;
    const win = iframe.contentWindow;
    const { handleX, handleY, deltaX, deltaY } = dragState.current;
    const upEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: win,
      clientX: handleX + deltaX,
      clientY: handleY + deltaY,
      buttons: 0,
      button: 0,
    });
    win.dispatchEvent(upEvent);
    dragState.current = null;
  }, []);

  const clickElement = useCallback(
    (selector: string, inShadow: boolean) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      const element = queryIframeElement(selector, inShadow);
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const eventInit = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: iframe.contentWindow!,
        detail: 1,
        screenX: x,
        screenY: y,
        clientX: x,
        clientY: y,
        button: 0,
        buttons: 1,
        relatedTarget: null,
      };
      if (!inShadow) {
        iframe.contentDocument!.dispatchEvent(
          new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: iframe.contentWindow!,
            clientX: x,
            clientY: y,
          })
        );
        setTimeout(() => {
          element!.dispatchEvent(
            new PointerEvent('pointerdown', {
              ...eventInit,
              pointerId: 1,
              pointerType: 'mouse',
              isPrimary: true,
            })
          );
          element!.dispatchEvent(
            new PointerEvent('pointerup', {
              ...eventInit,
              pointerId: 1,
              pointerType: 'mouse',
              isPrimary: true,
            })
          );
          element!.dispatchEvent(new MouseEvent('mousedown', eventInit));
          element!.dispatchEvent(new MouseEvent('mouseup', { ...eventInit, buttons: 0 }));
          element!.dispatchEvent(new MouseEvent('click', { ...eventInit, buttons: 0 }));
        }, 50);
        return;
      }
      element.dispatchEvent(new MouseEvent('mousedown', eventInit));
      element.dispatchEvent(new MouseEvent('mouseup', { ...eventInit, buttons: 0 }));
      element.dispatchEvent(new MouseEvent('click', { ...eventInit, buttons: 0 }));
    },
    [queryIframeElement]
  );

  // Select a value from a <select> dropdown in the shadow DOM
  const selectDropdownValue = useCallback(
    (selector: string, value: string) => {
      const select = queryIframeElement(selector, true) as HTMLSelectElement | null;
      if (!select) return;
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    },
    [queryIframeElement]
  );

  // Set a color input value in the shadow DOM
  const setColorInput = useCallback(
    (selector: string, value: string) => {
      const input = queryIframeElement(selector, true) as HTMLInputElement | null;
      if (!input) return;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    [queryIframeElement]
  );

  // Set a number input value in the shadow DOM
  const setNumberInput = useCallback(
    (selector: string, value: number) => {
      const input = queryIframeElement(selector, true) as HTMLInputElement | null;
      if (!input) return;
      input.focus();
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    [queryIframeElement]
  );

  // Annotation drag state (separate from padding resize drag)
  const annotationDragState = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    startFrame: number;
    endFrame: number;
  } | null>(null);

  // Start annotation drawing - mousedown on the crosshair overlay div
  const startAnnotationDraw = useCallback(
    (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      startFrame: number,
      endFrame: number
    ) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;
      const overlay = queryIframeElement(
        'div[style*="cursor:crosshair"]',
        true
      ) as HTMLElement | null;
      if (!overlay) return;

      const win = iframe.contentWindow;
      const eventBase = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: win,
        button: 0,
        buttons: 1,
      };
      overlay.dispatchEvent(
        new MouseEvent('mousedown', { ...eventBase, clientX: startX, clientY: startY })
      );

      annotationDragState.current = {
        active: true,
        startX,
        startY,
        endX,
        endY,
        startFrame,
        endFrame,
      };
    },
    [queryIframeElement]
  );

  // Update annotation drawing position per frame
  const updateAnnotationDraw = useCallback((progress: number) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !annotationDragState.current) return;
    const win = iframe.contentWindow;
    const { startX, startY, endX, endY } = annotationDragState.current;
    const currentX = startX + (endX - startX) * progress;
    const currentY = startY + (endY - startY) * progress;
    // AnnotationLayer uses globalThis (window) listeners in capture phase
    win.dispatchEvent(
      new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        view: win,
        clientX: currentX,
        clientY: currentY,
        buttons: 1,
        button: 0,
      })
    );
  }, []);

  // End annotation drawing
  const endAnnotationDraw = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow || !annotationDragState.current) return;
    const win = iframe.contentWindow;
    const { endX, endY } = annotationDragState.current;
    win.dispatchEvent(
      new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        view: win,
        clientX: endX,
        clientY: endY,
        buttons: 0,
        button: 0,
      })
    );
    annotationDragState.current = null;
  }, []);

  // Measure element positions on each render until done (skip in rendering mode - use fallbacks)
  const measurementAttempts = useRef(0);
  const measurementDone = useRef(isRendering); // Already done if rendering with fallbacks

  // Run measurement on every render until we get positions (only in preview mode)
  if (!isRendering && !measurementDone.current && iframeRef.current) {
    measurementAttempts.current++;
    const pickerButton = getElementCenter('button[title="Pick element"]', true);
    const featureCard = getElementCenter('.feature-card', false);
    const featureCardCorner = getElementCorner('.feature-card', false, 'bottom-right');
    const contentArea = getElementCenter('.content', false);

    if (pickerButton && featureCard && featureCardCorner && contentArea) {
      measurementDone.current = true;
      const newPositions = {
        pickerButton,
        featureCard,
        featureCardCorner,
        annotateButton: null,
        paddingFillSelect: null,
        borderColorInput: null,
        borderWidthInput: null,
        borderRadiusInput: null,
        arrowStart: null,
        arrowEnd: null,
        doneButton: null,
        start: contentArea,
      };
      positionsRef.current = newPositions;
      setTimeout(() => {
        setPositions(newPositions);
        if (handle) continueRender(handle);
      }, 0);
    } else if (measurementAttempts.current >= 300) {
      measurementDone.current = true;
      const newPositions = {
        pickerButton: pickerButton || { x: 1100, y: 30 },
        featureCard: featureCard || { x: 500, y: 300 },
        featureCardCorner: featureCardCorner || { x: 710, y: 480 },
        annotateButton: null,
        paddingFillSelect: null,
        borderColorInput: null,
        borderWidthInput: null,
        borderRadiusInput: null,
        arrowStart: null,
        arrowEnd: null,
        doneButton: null,
        start: contentArea || { x: 600, y: 400 },
      };
      positionsRef.current = newPositions;
      setTimeout(() => {
        setPositions(newPositions);
        if (handle) continueRender(handle);
      }, 0);
    }
  }

  // Trigger clicks at the right scene frames
  // ORDER: picker → element → type name → drag corner → configbar styling → annotate → done
  useEffect(() => {
    if (browserOpacity < 0.5 || !showDocsPage) return;

    // SCENE: CLICK_PICKER - click picker button to enable picker mode
    const pickerClickFrame = SCENE_START.CLICK_PICKER + 6;
    if (frame >= pickerClickFrame && lastClickFrame.current < pickerClickFrame) {
      lastClickFrame.current = pickerClickFrame;
      setTimeout(() => clickElement('button[title="Pick element"]', true), 50);
    }

    // SCENE: CLICK_ELEMENT - click on feature card to select it
    const elementClickFrame = SCENE_START.CLICK_ELEMENT + 6;
    if (
      frame >= elementClickFrame &&
      lastClickFrame.current < elementClickFrame &&
      lastClickFrame.current >= pickerClickFrame
    ) {
      lastClickFrame.current = elementClickFrame;
      setTimeout(() => {
        // Ensure welcome page is hidden before clicking
        const iframe = iframeRef.current;
        if (iframe?.contentDocument) {
          const welcomePage = iframe.contentDocument.querySelector('.welcome-page') as HTMLElement;
          if (welcomePage) {
            welcomePage.style.display = 'none';
          }
        }
        clickElement('.feature-card', false);
        // Measure resize handle, buttons, and ConfigBar control positions after selection appears
        setTimeout(() => {
          const handlePos = getResizeHandlePosition();
          if (handlePos) {
            setResizeHandlePos(handlePos);
          }
          const doneButton = getElementCenter('button[title="Done"]', true);
          const annotateButton = getElementCenter('button[title^="Annotate"]', true);
          const paddingFillSelect = getElementCenter('select', true);
          const borderColorInput = getElementCenter('input[title="Border color"]', true);
          const borderWidthInput = getElementCenter('input[title="Border width (px)"]', true);
          const borderRadiusInput = getElementCenter('input[title="Border radius (px)"]', true);
          positionsRef.current = {
            ...positionsRef.current,
            ...(doneButton ? { doneButton } : {}),
            ...(annotateButton ? { annotateButton } : {}),
            ...(paddingFillSelect ? { paddingFillSelect } : {}),
            ...(borderColorInput ? { borderColorInput } : {}),
            ...(borderWidthInput ? { borderWidthInput } : {}),
            ...(borderRadiusInput ? { borderRadiusInput } : {}),
          };
          setPositions(positionsRef.current);
        }, 300);
      }, 50);
    }

    /** Trigger an action once when frame reaches triggerFrame, guarded by lastClickFrame */
    const triggerOnce = (triggerFrame: number, prevFrame: number, action: () => void) => {
      if (
        frame >= triggerFrame &&
        lastClickFrame.current < triggerFrame &&
        lastClickFrame.current >= prevFrame
      ) {
        lastClickFrame.current = triggerFrame;
        setTimeout(action, 50);
      }
    };

    /** Animate a number input over a frame range */
    const animateNumber = (
      selector: string,
      startF: number,
      endF: number,
      fromValue: number,
      toValue: number
    ) => {
      if (frame >= startF && frame < endF) {
        const progress = Math.min(1, (frame - startF) / (endF - startF));
        setNumberInput(selector, Math.round(fromValue + progress * (toValue - fromValue)));
      }
    };

    // SCENE: TYPE_NAME
    const typeNameFrame = SCENE_START.TYPE_NAME + 6;
    triggerOnce(typeNameFrame, elementClickFrame, () => {
      clickElement('input', true);
      setTimeout(() => typeText('Demo', true), 100);
    });

    // SCENE: DRAG_CORNER - drag resize handle to ADD WHITE PADDING
    const dragStartFrame = SCENE_START.DRAG_CORNER;
    const dragEndFrame = SCENE_START.CURSOR_TO_PADDING_FILL;
    triggerOnce(dragStartFrame, typeNameFrame, () =>
      startDrag(50, 50, dragStartFrame, dragEndFrame)
    );

    if (frame >= dragStartFrame && frame < dragEndFrame && dragState.current?.active) {
      updateDrag((frame - dragStartFrame) / (dragEndFrame - dragStartFrame));
    }

    if (frame >= dragEndFrame && dragState.current?.active) {
      endDrag();
      setTimeout(() => {
        const titleCenter = getElementCenter('.feature-title', false);
        if (titleCenter) {
          const arrowEnd = { x: titleCenter.x, y: titleCenter.y + 30 };
          const arrowStart = { x: titleCenter.x + 100, y: titleCenter.y + 130 };
          positionsRef.current = { ...positionsRef.current, arrowStart, arrowEnd };
          setPositions(positionsRef.current);
        }
      }, 100);
    }

    // SCENE: CLICK_PADDING_FILL
    const paddingFillFrame = SCENE_START.CLICK_PADDING_FILL + 3;
    triggerOnce(paddingFillFrame, dragStartFrame, () => selectDropdownValue('select', 'solid'));

    // SCENE: CLICK_BORDER_COLOR
    const borderColorFrame = SCENE_START.CLICK_BORDER_COLOR + 3;
    triggerOnce(borderColorFrame, paddingFillFrame, () =>
      setColorInput('input[title="Border color"]', '#818cf8')
    );

    // SCENE: ANIMATE_BORDER_WIDTH (0 → 3)
    const borderWidthStartFrame = SCENE_START.ANIMATE_BORDER_WIDTH;
    const borderWidthEndFrame = SCENE_START.CURSOR_TO_BORDER_RADIUS;
    triggerOnce(borderWidthStartFrame, borderColorFrame, () =>
      clickElement('input[title="Border width (px)"]', true)
    );
    animateNumber(
      'input[title="Border width (px)"]',
      borderWidthStartFrame,
      borderWidthEndFrame,
      0,
      3
    );

    // SCENE: ANIMATE_BORDER_RADIUS (0 → 100)
    const borderRadiusStartFrame = SCENE_START.ANIMATE_BORDER_RADIUS;
    const borderRadiusEndFrame = SCENE_START.CONFIGBAR_SETTLE;
    triggerOnce(borderRadiusStartFrame, borderWidthStartFrame, () =>
      clickElement('input[title="Border radius (px)"]', true)
    );
    animateNumber(
      'input[title="Border radius (px)"]',
      borderRadiusStartFrame,
      borderRadiusEndFrame,
      0,
      100
    );

    // Re-measure annotate + done button positions before cursor moves there
    if (frame >= SCENE_START.CONFIGBAR_SETTLE && !positionsRef.current.annotateButton) {
      const annotateButton = getElementCenter('button[title^="Annotate"]', true);
      const doneButton = getElementCenter('button[title="Done"]', true);
      if (annotateButton || doneButton) {
        positionsRef.current = {
          ...positionsRef.current,
          ...(annotateButton ? { annotateButton } : {}),
          ...(doneButton ? { doneButton } : {}),
        };
        setPositions(positionsRef.current);
      }
    }

    // SCENE: CLICK_ANNOTATE
    const annotateFrame = SCENE_START.CLICK_ANNOTATE + 6;
    triggerOnce(annotateFrame, borderRadiusStartFrame, () =>
      clickElement('button[title^="Annotate"]', true)
    );

    // SCENE: DRAW_ARROW
    const arrowStartFrame = SCENE_START.DRAW_ARROW;
    const arrowEndFrame = SCENE_START.ANNOTATION_SETTLE;
    const arrowStart = positionsRef.current.arrowStart || FALLBACK_POSITIONS.arrowStart;
    const arrowEnd = positionsRef.current.arrowEnd || FALLBACK_POSITIONS.arrowEnd;
    triggerOnce(arrowStartFrame, annotateFrame, () =>
      startAnnotationDraw(
        arrowStart.x,
        arrowStart.y,
        arrowEnd.x,
        arrowEnd.y,
        arrowStartFrame,
        arrowEndFrame
      )
    );

    if (frame >= arrowStartFrame && frame < arrowEndFrame && annotationDragState.current?.active) {
      updateAnnotationDraw((frame - arrowStartFrame) / (arrowEndFrame - arrowStartFrame));
    }

    if (frame >= arrowEndFrame && annotationDragState.current?.active) {
      endAnnotationDraw();
      // Measure annotation ConfigBar inputs after arrow is drawn
      setTimeout(() => {
        const strokeColorInput = getElementCenter('input[type="color"]', true);
        const strokeWidthInput = getElementCenter('input[type="number"]', true);
        if (strokeColorInput || strokeWidthInput) {
          positionsRef.current = {
            ...positionsRef.current,
            ...(strokeColorInput ? { strokeColorInput } : {}),
            ...(strokeWidthInput ? { strokeWidthInput } : {}),
          };
          setPositions(positionsRef.current);
        }
      }, 100);
    }

    // SCENE: SET_STROKE_COLOR - set stroke color to match border (#818cf8)
    const strokeColorFrame = SCENE_START.SET_STROKE_COLOR + 3;
    triggerOnce(strokeColorFrame, arrowStartFrame, () =>
      setColorInput('input[type="color"]', '#818cf8')
    );

    // SCENE: ANIMATE_STROKE_WIDTH (3 → 8)
    const strokeWidthStartFrame = SCENE_START.ANIMATE_STROKE_WIDTH;
    const strokeWidthEndFrame = SCENE_START.CURSOR_TO_DESELECT;
    triggerOnce(strokeWidthStartFrame, strokeColorFrame, () =>
      clickElement('input[type="number"]', true)
    );
    animateNumber('input[type="number"]', strokeWidthStartFrame, strokeWidthEndFrame, 3, 8);

    // SCENE: CLICK_DESELECT - click on element area to deselect annotation
    const deselectFrame = SCENE_START.CLICK_DESELECT + 3;
    triggerOnce(deselectFrame, strokeWidthStartFrame, () => clickElement('.feature-image', false));

    // SCENE: CLICK_DONE
    const doneFrame = SCENE_START.CLICK_DONE + 6;
    triggerOnce(doneFrame, deselectFrame, () => clickElement('button[title="Done"]', true));
  }, [
    frame,
    browserOpacity,
    showDocsPage,
    clickElement,
    typeText,
    startDrag,
    updateDrag,
    endDrag,
    selectDropdownValue,
    setColorInput,
    setNumberInput,
    startAnnotationDraw,
    updateAnnotationDraw,
    endAnnotationDraw,
    getResizeHandlePosition,
    getElementCenter,
    getElementCorner,
    resizeHandlePos,
  ]);

  // Reset on rewind
  useEffect(() => {
    if (frame === 0) {
      lastClickFrame.current = -1;
      setResizeHandlePos(null);
      dragState.current = null;
      annotationDragState.current = null;
    }
  }, [frame]);

  // Toggle welcome page visibility based on frame - run every frame to ensure consistency
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const welcomePage = iframe.contentDocument.querySelector('.welcome-page') as HTMLElement;
    if (welcomePage) {
      if (showDocsPage) {
        welcomePage.style.display = 'none';
      } else {
        welcomePage.style.display = 'flex';
      }
    }
  }, [frame, showDocsPage]);

  // Browser position
  const browserLeft = 40;
  const browserTop = 40;

  // Build cursor path using scene-based timing
  // Part 1: Address bar interaction (doesn't need iframe positions)
  const addressBarPath = [
    { x: 640, y: 400, frame: 0 },
    { x: 640, y: 400, frame: SCENE_START.CURSOR_TO_ADDRESS },
    // Move to address bar and click
    { x: ADDRESS_BAR_X, y: ADDRESS_BAR_Y, frame: SCENE_START.ADDRESS_FOCUS, click: true },
    { x: ADDRESS_BAR_X, y: ADDRESS_BAR_Y, frame: SCENE_START.CURSOR_TO_PICKER },
  ];

  // Use ref for immediate access to positions (state update is async)
  const pos = positionsRef.current;

  // Part 2: Picker workflow (needs iframe positions) - each move aligned to scene start
  // Use measured resize handle position for precise drag, fallback to corner estimate
  const handleX = resizeHandlePos
    ? browserLeft + resizeHandlePos.x
    : browserLeft + (pos.featureCardCorner?.x ?? 0);
  const handleY = resizeHandlePos
    ? browserTop + BROWSER_HEADER_HEIGHT + resizeHandlePos.y
    : browserTop + BROWSER_HEADER_HEIGHT + (pos.featureCardCorner?.y ?? 0);

  // All positions converted from iframe-local to screen space: browserLeft + x, browserTop + BROWSER_HEADER_HEIGHT + y
  const toScreenX = (x: number) => browserLeft + x;
  const toScreenY = (y: number) => browserTop + BROWSER_HEADER_HEIGHT + y;

  // Done button position (measured after element selected, fallback to picker position)
  const doneX = toScreenX(pos.doneButton?.x ?? pos.pickerButton?.x ?? 0);
  const doneY = toScreenY(pos.doneButton?.y ?? pos.pickerButton?.y ?? 0);

  // Annotate button position (measured after element selected, fallback near picker)
  const annotateX = toScreenX(pos.annotateButton?.x ?? pos.pickerButton?.x ?? 30);
  const annotateY = toScreenY(pos.annotateButton?.y ?? (pos.pickerButton?.y ?? 40) + 80);

  // Arrow positions — computed relative to feature-title center after drag
  // arrowStart: southeast of title, arrowEnd: just below title center
  const arrowStartX = toScreenX(pos.arrowStart?.x ?? (pos.featureCard?.x ?? 0) + 100);
  const arrowStartY = toScreenY(pos.arrowStart?.y ?? (pos.featureCard?.y ?? 0) + 130);
  const arrowEndX = toScreenX(pos.arrowEnd?.x ?? pos.featureCard?.x ?? 0);
  const arrowEndY = toScreenY(pos.arrowEnd?.y ?? (pos.featureCard?.y ?? 0) + 30);

  // Annotation ConfigBar input positions (measured after arrow drawn)
  const strokeColorX = toScreenX(
    pos.strokeColorInput?.x ?? (pos.arrowEnd?.x ?? pos.featureCard?.x ?? 0) + 50
  );
  const strokeColorY = toScreenY(
    pos.strokeColorInput?.y ?? pos.arrowEnd?.y ?? pos.featureCard?.y ?? 0
  );
  const strokeWidthX = toScreenX(pos.strokeWidthInput?.x ?? strokeColorX);
  const strokeWidthY = toScreenY(
    pos.strokeWidthInput?.y ?? (pos.strokeColorInput?.y ?? pos.arrowEnd?.y ?? 0) + 30
  );

  // Drag end position (where cursor stops after drag corner)
  const dragEndX = handleX + 50;
  const dragEndY = handleY + 50;

  const pickerPath =
    pos.pickerButton && pos.featureCard && pos.featureCardCorner
      ? [
          // SCENE: CLICK_PICKER - move to picker, click
          {
            x: toScreenX(pos.pickerButton.x),
            y: toScreenY(pos.pickerButton.y),
            frame: SCENE_START.CLICK_PICKER,
            click: true,
          },
          {
            x: toScreenX(pos.pickerButton.x),
            y: toScreenY(pos.pickerButton.y),
            frame: SCENE_START.CURSOR_TO_ELEMENT,
          },
          // SCENE: CLICK_ELEMENT - move to element, click
          {
            x: toScreenX(pos.featureCard.x),
            y: toScreenY(pos.featureCard.y),
            frame: SCENE_START.CLICK_ELEMENT,
            click: true,
          },
          // SCENE: TYPE_NAME - cursor stays IDLE at element position while typing happens
          {
            x: toScreenX(pos.featureCard.x),
            y: toScreenY(pos.featureCard.y),
            frame: SCENE_START.CURSOR_TO_CORNER,
          },
          // SCENE: CURSOR_TO_CORNER - move to bottom-right corner (resize handle)
          { x: handleX, y: handleY, frame: SCENE_START.DRAG_CORNER },
          // SCENE: DRAG_CORNER - drag DOWN and RIGHT to add white padding (linear movement)
          { x: dragEndX, y: dragEndY, frame: SCENE_START.CURSOR_TO_PADDING_FILL, linear: true },
          // SCENE: CURSOR_TO_PADDING_FILL - move to padding fill dropdown
          {
            x: toScreenX(pos.paddingFillSelect?.x ?? pos.featureCard.x),
            y: toScreenY(pos.paddingFillSelect?.y ?? pos.featureCard.y - 30),
            frame: SCENE_START.CLICK_PADDING_FILL,
            click: true,
          },
          // SCENE: CLICK_PADDING_FILL - stay, then move to border color
          {
            x: toScreenX(pos.paddingFillSelect?.x ?? pos.featureCard.x),
            y: toScreenY(pos.paddingFillSelect?.y ?? pos.featureCard.y - 30),
            frame: SCENE_START.CURSOR_TO_BORDER_COLOR,
          },
          // SCENE: CURSOR_TO_BORDER_COLOR - move to border color input
          {
            x: toScreenX(pos.borderColorInput?.x ?? pos.featureCard.x + 100),
            y: toScreenY(pos.borderColorInput?.y ?? pos.featureCard.y),
            frame: SCENE_START.CLICK_BORDER_COLOR,
            click: true,
          },
          // SCENE: CLICK_BORDER_COLOR - stay, then move to border width
          {
            x: toScreenX(pos.borderColorInput?.x ?? pos.featureCard.x + 100),
            y: toScreenY(pos.borderColorInput?.y ?? pos.featureCard.y),
            frame: SCENE_START.CURSOR_TO_BORDER_WIDTH,
          },
          // SCENE: CURSOR_TO_BORDER_WIDTH - move to border width input
          {
            x: toScreenX(pos.borderWidthInput?.x ?? pos.featureCard.x + 50),
            y: toScreenY(pos.borderWidthInput?.y ?? pos.featureCard.y),
            frame: SCENE_START.ANIMATE_BORDER_WIDTH,
            click: true,
          },
          // SCENE: ANIMATE_BORDER_WIDTH - cursor stays while value animates
          {
            x: toScreenX(pos.borderWidthInput?.x ?? pos.featureCard.x + 50),
            y: toScreenY(pos.borderWidthInput?.y ?? pos.featureCard.y),
            frame: SCENE_START.CURSOR_TO_BORDER_RADIUS,
          },
          // SCENE: CURSOR_TO_BORDER_RADIUS - move to border radius input
          {
            x: toScreenX(pos.borderRadiusInput?.x ?? pos.featureCard.x + 50),
            y: toScreenY(pos.borderRadiusInput?.y ?? pos.featureCard.y + 20),
            frame: SCENE_START.ANIMATE_BORDER_RADIUS,
            click: true,
          },
          // SCENE: ANIMATE_BORDER_RADIUS - cursor stays while value animates
          {
            x: toScreenX(pos.borderRadiusInput?.x ?? pos.featureCard.x + 50),
            y: toScreenY(pos.borderRadiusInput?.y ?? pos.featureCard.y + 20),
            frame: SCENE_START.CONFIGBAR_SETTLE,
          },
          // SCENE: CONFIGBAR_SETTLE - pause, cursor idle
          {
            x: toScreenX(pos.borderRadiusInput?.x ?? pos.featureCard.x + 50),
            y: toScreenY(pos.borderRadiusInput?.y ?? pos.featureCard.y + 20),
            frame: SCENE_START.CURSOR_TO_ANNOTATE,
          },
          // SCENE: CURSOR_TO_ANNOTATE - move to Annotate button in EditorBar
          { x: annotateX, y: annotateY, frame: SCENE_START.CLICK_ANNOTATE, click: true },
          // SCENE: CLICK_ANNOTATE - stay at Annotate, then move to arrow start
          { x: annotateX, y: annotateY, frame: SCENE_START.CURSOR_TO_ARROW_START },
          // SCENE: CURSOR_TO_ARROW_START - move to arrow start position
          { x: arrowStartX, y: arrowStartY, frame: SCENE_START.DRAW_ARROW },
          // SCENE: DRAW_ARROW - drag from start to end (linear movement)
          { x: arrowEndX, y: arrowEndY, frame: SCENE_START.ANNOTATION_SETTLE, linear: true },
          // SCENE: ANNOTATION_SETTLE - brief pause, then move to stroke color
          { x: arrowEndX, y: arrowEndY, frame: SCENE_START.CURSOR_TO_STROKE_COLOR },
          // SCENE: CURSOR_TO_STROKE_COLOR - move to stroke color input
          { x: strokeColorX, y: strokeColorY, frame: SCENE_START.SET_STROKE_COLOR, click: true },
          // SCENE: SET_STROKE_COLOR - stay, then move to stroke width
          { x: strokeColorX, y: strokeColorY, frame: SCENE_START.CURSOR_TO_STROKE_WIDTH },
          // SCENE: CURSOR_TO_STROKE_WIDTH - move to stroke-width input
          {
            x: strokeWidthX,
            y: strokeWidthY,
            frame: SCENE_START.ANIMATE_STROKE_WIDTH,
            click: true,
          },
          // SCENE: ANIMATE_STROKE_WIDTH - cursor stays while value animates
          { x: strokeWidthX, y: strokeWidthY, frame: SCENE_START.CURSOR_TO_DESELECT },
          // SCENE: CURSOR_TO_DESELECT - move to element area (feature image)
          {
            x: toScreenX(pos.featureCard.x),
            y: toScreenY(pos.featureCard.y - 60),
            frame: SCENE_START.CLICK_DESELECT,
            click: true,
          },
          // SCENE: CLICK_DESELECT + FINAL_SETTLE - viewer sees final result
          {
            x: toScreenX(pos.featureCard.x),
            y: toScreenY(pos.featureCard.y - 60),
            frame: SCENE_START.CURSOR_TO_DONE,
          },
          // SCENE: CURSOR_TO_DONE - move to Done button
          { x: doneX, y: doneY, frame: SCENE_START.CLICK_DONE, click: true },
          // SCENE: CLICK_DONE - stay at Done, then move away
          { x: doneX, y: doneY, frame: SCENE_START.BROWSER_CLOSE },
          { x: 640, y: 400, frame: SCENE_START.TERMINAL_OUTPUT },
          { x: 640, y: 400, frame: TOTAL_FRAMES },
        ]
      : null;

  // Combine paths - keep full addressBarPath so cursor waits at address bar
  const cursorPath = pickerPath ? [...addressBarPath, ...pickerPath] : addressBarPath;

  // Show cursor during browser phase
  const showCursor = frame >= BROWSER_OPEN_END && frame < BROWSER_CLOSE_FRAME;

  return (
    <AbsoluteFill>
      {/* Wallpaper background */}
      <img
        src={wallpaperUrl}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Terminal */}
      {terminalOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${frame < BROWSER_OPEN_START ? terminalScale : 1})`,
            opacity: terminalOpacity,
          }}
        >
          <Terminal
            typingStartFrame={TERMINAL_TYPE_START}
            typingEndFrame={TERMINAL_TYPE_END}
            outputStartFrame={frame >= BROWSER_CLOSE_FRAME ? TERMINAL_OUTPUT_START : undefined}
            command="npx heroshot"
            output={terminalOutput}
          />
        </div>
      )}

      {/* Browser window */}
      {browserOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: browserLeft,
            top: browserTop,
            width: 1200,
            height: 720,
            opacity: browserOpacity,
            transform: `scale(${browserScale})`,
            transformOrigin: 'center center',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Browser chrome */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 16px',
              background: '#e8e8e8',
              gap: 8,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
            <div
              style={{
                flex: 1,
                marginLeft: 16,
                marginRight: 60,
                padding: '6px 12px',
                background: addressSelected ? '#cce5ff' : '#fff',
                borderRadius: 6,
                fontSize: 13,
                color: '#333',
                textAlign: 'left',
                fontFamily: 'system-ui, sans-serif',
                border: addressSelected ? '2px solid #007bff' : '2px solid transparent',
              }}
            >
              <span
                style={{
                  background: addressSelected ? '#007bff' : 'transparent',
                  color: addressSelected ? '#fff' : '#333',
                  padding: addressSelected ? '0 2px' : '0',
                }}
              >
                {addressDisplay}
              </span>
              {addressTyping && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 2,
                    height: 14,
                    background: '#333',
                    marginLeft: 1,
                    verticalAlign: 'text-bottom',
                    opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
                  }}
                />
              )}
            </div>
          </div>

          {/* iframe content */}
          <iframe
            ref={iframeRef}
            style={{
              width: '100%',
              height: 'calc(100% - 48px)',
              border: 'none',
              background: '#f0f4f8',
            }}
            srcDoc={iframeSrcDoc}
          />
        </div>
      )}

      {/* Cursor */}
      {showCursor && cursorPath && <Cursor size={56} path={cursorPath} />}
    </AbsoluteFill>
  );
};
