import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createOverlay,
  createToolbar,
  deepElementFromPoint,
  getBackgroundColor,
  getSelector,
  updateOverlay,
} from '../dom';

describe('getBackgroundColor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return white when no background found', () => {
    const div = document.createElement('div');
    document.body.append(div);
    expect(getBackgroundColor(div)).toBe('#ffffff');
  });

  it('should return element own background color', () => {
    const div = document.createElement('div');
    div.style.backgroundColor = 'rgb(30, 30, 30)';
    document.body.append(div);
    expect(getBackgroundColor(div)).toBe('#1e1e1e');
  });

  it('should return parent background color as hex', () => {
    const parent = document.createElement('div');
    parent.style.backgroundColor = 'rgb(255, 0, 0)';
    const child = document.createElement('span');
    parent.append(child);
    document.body.append(parent);

    expect(getBackgroundColor(child)).toBe('#ff0000');
  });

  it('should walk up tree to find non-transparent background', () => {
    const grandparent = document.createElement('div');
    grandparent.style.backgroundColor = 'rgb(0, 128, 255)';
    const parent = document.createElement('div');
    parent.style.backgroundColor = 'transparent';
    const child = document.createElement('span');
    parent.append(child);
    grandparent.append(parent);
    document.body.append(grandparent);

    expect(getBackgroundColor(child)).toBe('#0080ff');
  });

  it('should handle rgba transparent background', () => {
    const grandparent = document.createElement('div');
    grandparent.style.backgroundColor = 'rgb(100, 100, 100)';
    const parent = document.createElement('div');
    parent.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    const child = document.createElement('span');
    parent.append(child);
    grandparent.append(parent);
    document.body.append(grandparent);

    expect(getBackgroundColor(child)).toBe('#646464');
  });

  it('should return raw color if not rgb format', () => {
    const parent = document.createElement('div');
    // Mock getComputedStyle to return a non-rgb color
    const originalGetComputedStyle = globalThis.getComputedStyle;
    globalThis.getComputedStyle = vi.fn().mockReturnValue({
      backgroundColor: 'red',
    });

    const child = document.createElement('span');
    parent.append(child);
    document.body.append(parent);

    expect(getBackgroundColor(child)).toBe('red');

    globalThis.getComputedStyle = originalGetComputedStyle;
  });

  it('should pierce shadow DOM when walking up', () => {
    const host = document.createElement('div');
    host.style.backgroundColor = 'rgb(0, 255, 0)';
    const shadow = host.attachShadow({ mode: 'open' });
    const shadowParent = document.createElement('div');
    shadowParent.style.backgroundColor = 'transparent';
    const inner = document.createElement('span');
    shadowParent.append(inner);
    shadow.append(shadowParent);
    document.body.append(host);

    expect(getBackgroundColor(inner)).toBe('#00ff00');
  });
});

describe('deepElementFromPoint', () => {
  let originalElementFromPoint: typeof document.elementFromPoint;

  beforeEach(() => {
    document.body.innerHTML = '';
    // Store original and create mock
    originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn();
  });

  afterEach(() => {
    document.elementFromPoint = originalElementFromPoint;
  });

  it('should return null when no element at point', () => {
    vi.mocked(document.elementFromPoint).mockReturnValue(null);
    expect(deepElementFromPoint(0, 0)).toBeNull();
  });

  it('should return element when no shadow DOM', () => {
    const div = document.createElement('div');
    vi.mocked(document.elementFromPoint).mockReturnValue(div);
    expect(deepElementFromPoint(100, 100)).toBe(div);
  });

  it('should pierce shadow DOM', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('span');
    shadow.append(inner);

    vi.mocked(document.elementFromPoint).mockReturnValue(host);
    shadow.elementFromPoint = vi.fn().mockReturnValue(inner);

    expect(deepElementFromPoint(100, 100)).toBe(inner);
  });

  it('should stop if shadow returns same element', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });

    vi.mocked(document.elementFromPoint).mockReturnValue(host);
    shadow.elementFromPoint = vi.fn().mockReturnValue(host);

    expect(deepElementFromPoint(100, 100)).toBe(host);
  });

  it('should stop if shadow returns null', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });

    vi.mocked(document.elementFromPoint).mockReturnValue(host);
    shadow.elementFromPoint = vi.fn().mockReturnValue(null);

    expect(deepElementFromPoint(100, 100)).toBe(host);
  });
});

describe('getSelector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return id selector if element has id', () => {
    const div = document.createElement('div');
    div.id = 'my-element';
    document.body.append(div);

    expect(getSelector(div)).toBe('#my-element');
  });

  it('should ignore heroshot-prefixed ids', () => {
    const div = document.createElement('div');
    div.id = 'heroshot-toolbar';
    document.body.append(div);

    const result = getSelector(div);
    expect(result).not.toContain('#heroshot-toolbar');
    expect(result).toContain('div');
  });

  it('should include class names in selector', () => {
    const div = document.createElement('div');
    div.className = 'btn primary';
    document.body.append(div);

    expect(getSelector(div)).toContain('.btn.primary');
  });

  it('should limit to first 2 classes', () => {
    const div = document.createElement('div');
    div.className = 'one two three four';
    document.body.append(div);

    const result = getSelector(div);
    expect(result).toContain('.one.two');
    expect(result).not.toContain('.three');
  });

  it('should filter out heroshot classes', () => {
    const div = document.createElement('div');
    div.className = 'heroshot-active btn';
    document.body.append(div);

    const result = getSelector(div);
    expect(result).not.toContain('heroshot');
    expect(result).toContain('.btn');
  });

  it('should add nth-of-type for siblings', () => {
    const parent = document.createElement('div');
    const child1 = document.createElement('span');
    const child2 = document.createElement('span');
    parent.append(child1);
    parent.append(child2);
    document.body.append(parent);

    expect(getSelector(child2)).toContain(':nth-of-type(2)');
  });

  it('should stop at ancestor with id', () => {
    const parent = document.createElement('div');
    parent.id = 'container';
    const child = document.createElement('span');
    parent.append(child);
    document.body.append(parent);

    const result = getSelector(child);
    expect(result).toBe('#container > span');
  });

  it('should generate shadow DOM piercing selector', () => {
    const host = document.createElement('div');
    host.id = 'host';
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('span');
    inner.className = 'inner';
    shadow.append(inner);
    document.body.append(host);

    const result = getSelector(inner);
    expect(result).toContain('>>');
    expect(result).not.toContain('>>>'); // Should use Playwright-style >> not legacy >>>
    expect(result).toContain('#host');
    expect(result).toContain('span.inner');
  });

  it('should limit path depth to 20', () => {
    let current = document.body;
    for (let index = 0; index < 30; index++) {
      const div = document.createElement('div');
      current.append(div);
      current = div;
    }

    const result = getSelector(current);
    const parts = result.split(' > ');
    expect(parts.length).toBeLessThanOrEqual(20);
  });
});

describe('createToolbar', () => {
  it('should create toolbar element with correct id', () => {
    const toolbar = createToolbar();
    expect(toolbar.id).toBe('heroshot-toolbar');
  });

  it('should contain picker button', () => {
    const toolbar = createToolbar();
    const button = toolbar.querySelector('#heroshot-picker-btn');
    expect(button).not.toBeNull();
  });

  it('should contain status element', () => {
    const toolbar = createToolbar();
    const status = toolbar.querySelector('#heroshot-status');
    expect(status).not.toBeNull();
    expect(status?.textContent).toContain('Click crosshair');
  });

  it('should contain SVG icon', () => {
    const toolbar = createToolbar();
    const svg = toolbar.querySelector('svg');
    expect(svg).not.toBeNull();
  });
});

describe('createOverlay', () => {
  it('should create overlay element with correct id', () => {
    const overlay = createOverlay();
    expect(overlay.id).toBe('heroshot-overlay');
  });

  it('should be hidden by default', () => {
    const overlay = createOverlay();
    expect(overlay.style.display).toBe('none');
  });
});

describe('updateOverlay', () => {
  let overlay: HTMLDivElement;

  beforeEach(() => {
    overlay = createOverlay();
    document.body.append(overlay);
  });

  it('should hide overlay when rect is null', () => {
    overlay.style.display = 'block';
    updateOverlay(overlay, null);
    expect(overlay.style.display).toBe('none');
  });

  it('should clear previous content when rect is null', () => {
    overlay.innerHTML = '<div>old content</div>';
    updateOverlay(overlay, null);
    expect(overlay.innerHTML).toBe('');
  });

  it('should show overlay when rect is provided', () => {
    const rect = new DOMRect(100, 100, 200, 150);
    updateOverlay(overlay, rect);
    expect(overlay.style.display).toBe('block');
  });

  it('should create 4 dark overlay areas', () => {
    const rect = new DOMRect(100, 100, 200, 150);
    updateOverlay(overlay, rect);

    const darkAreas = overlay.querySelectorAll('.heroshot-overlay-dark');
    expect(darkAreas.length).toBe(4);
  });

  it('should create highlight element', () => {
    const rect = new DOMRect(100, 100, 200, 150);
    updateOverlay(overlay, rect);

    const highlight = overlay.querySelector('.heroshot-highlight');
    expect(highlight).not.toBeNull();
  });

  it('should position highlight at rect location', () => {
    const rect = new DOMRect(100, 50, 200, 150);
    updateOverlay(overlay, rect);

    const highlight = overlay.querySelector('.heroshot-highlight');
    expect(highlight).not.toBeNull();
    const highlightElement = highlight as HTMLElement;
    expect(highlightElement.style.top).toBe('50px');
    expect(highlightElement.style.left).toBe('100px');
    expect(highlightElement.style.width).toBe('200px');
    expect(highlightElement.style.height).toBe('150px');
  });
});
