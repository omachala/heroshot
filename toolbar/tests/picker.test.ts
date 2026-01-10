import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initPicker } from '../src/picker';

describe('initPicker', () => {
  let cleanup: (() => void) | null;
  let originalElementFromPoint: typeof document.elementFromPoint;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.__heroshotPickerInit = false;
    cleanup = null;
    // Store original and create mock for elementFromPoint
    originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = vi.fn();
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
    }
    window.__heroshotPickerInit = false;
    document.elementFromPoint = originalElementFromPoint;
  });

  it('should initialize and return cleanup function', () => {
    cleanup = initPicker();
    expect(cleanup).toBeInstanceOf(Function);
  });

  it('should set __heroshotPickerInit flag', () => {
    cleanup = initPicker();
    expect(window.__heroshotPickerInit).toBe(true);
  });

  it('should prevent double initialization', () => {
    cleanup = initPicker();
    const second = initPicker();
    expect(second).toBeNull();
  });

  it('should append toolbar to body', () => {
    cleanup = initPicker();
    const toolbar = document.getElementById('heroshot-toolbar');
    expect(toolbar).not.toBeNull();
  });

  it('should append overlay to body', () => {
    cleanup = initPicker();
    const overlay = document.getElementById('heroshot-overlay');
    expect(overlay).not.toBeNull();
  });

  describe('cleanup', () => {
    it('should remove toolbar from DOM', () => {
      cleanup = initPicker();
      cleanup?.();
      cleanup = null;

      const toolbar = document.getElementById('heroshot-toolbar');
      expect(toolbar).toBeNull();
    });

    it('should remove overlay from DOM', () => {
      cleanup = initPicker();
      cleanup?.();
      cleanup = null;

      const overlay = document.getElementById('heroshot-overlay');
      expect(overlay).toBeNull();
    });

    it('should reset __heroshotPickerInit flag', () => {
      cleanup = initPicker();
      cleanup?.();
      cleanup = null;

      expect(window.__heroshotPickerInit).toBe(false);
    });

    it('should allow re-initialization after cleanup', () => {
      cleanup = initPicker();
      cleanup?.();

      cleanup = initPicker();
      expect(cleanup).toBeInstanceOf(Function);
    });
  });

  describe('picker activation', () => {
    it('should activate when button is clicked', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');

      btn?.click();

      expect(btn?.classList.contains('active')).toBe(true);
    });

    it('should update status text when activated', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');
      const status = document.getElementById('heroshot-status');

      btn?.click();

      expect(status?.textContent).toContain('Hover over element');
    });

    it('should set cursor to crosshair when activated', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');

      btn?.click();

      expect(document.body.style.cursor).toBe('crosshair');
    });

    it('should deactivate on second button click', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');

      btn?.click();
      btn?.click();

      expect(btn?.classList.contains('active')).toBe(false);
    });

    it('should reset cursor when deactivated', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');

      btn?.click();
      btn?.click();

      expect(document.body.style.cursor).toBe('');
    });
  });

  describe('keyboard handling', () => {
    it('should deactivate on Escape key', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');

      btn?.click();
      expect(btn?.classList.contains('active')).toBe(true);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(btn?.classList.contains('active')).toBe(false);
    });

    it('should ignore Escape when not active', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(btn?.classList.contains('active')).toBe(false);
    });

    it('should ignore other keys when active', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');

      btn?.click();
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      expect(btn?.classList.contains('active')).toBe(true);
    });
  });

  describe('element selection', () => {
    it('should call onElementPicked when element is clicked', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');
      const mockCallback = vi.fn();
      window.onElementPicked = mockCallback;

      // Create a test element
      const testEl = document.createElement('div');
      testEl.id = 'test-element';
      document.body.appendChild(testEl);

      // Activate picker
      btn?.click();

      // Mock elementFromPoint to return our test element
      vi.mocked(document.elementFromPoint).mockReturnValue(testEl);

      // Simulate mousemove to select element
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      document.dispatchEvent(moveEvent);

      // Click to confirm selection
      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      document.dispatchEvent(clickEvent);

      expect(mockCallback).toHaveBeenCalledWith({
        url: window.location.href,
        selector: '#test-element',
      });
    });

    it('should not select toolbar elements', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');
      const mockCallback = vi.fn();
      window.onElementPicked = mockCallback;

      btn?.click();

      // Mock elementFromPoint to return toolbar
      const toolbar = document.getElementById('heroshot-toolbar');
      vi.mocked(document.elementFromPoint).mockReturnValue(toolbar);

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      document.dispatchEvent(moveEvent);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should deactivate picker after selection', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');
      window.onElementPicked = vi.fn();

      const testEl = document.createElement('div');
      testEl.id = 'test-element';
      document.body.appendChild(testEl);

      btn?.click();

      vi.mocked(document.elementFromPoint).mockReturnValue(testEl);

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      document.dispatchEvent(moveEvent);

      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      document.dispatchEvent(clickEvent);

      expect(btn?.classList.contains('active')).toBe(false);
    });
  });

  describe('mouse movement', () => {
    it('should ignore mousemove when not active', () => {
      cleanup = initPicker();
      const status = document.getElementById('heroshot-status');
      const originalText = status?.textContent;

      const testEl = document.createElement('div');
      testEl.id = 'test-element';
      document.body.appendChild(testEl);

      vi.mocked(document.elementFromPoint).mockReturnValue(testEl);

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      document.dispatchEvent(moveEvent);

      expect(status?.textContent).toBe(originalText);
    });

    it('should update status with selector on mousemove', () => {
      cleanup = initPicker();
      const btn = document.getElementById('heroshot-picker-btn');
      const status = document.getElementById('heroshot-status');

      const testEl = document.createElement('div');
      testEl.id = 'test-element';
      document.body.appendChild(testEl);

      btn?.click();

      vi.mocked(document.elementFromPoint).mockReturnValue(testEl);

      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });
      document.dispatchEvent(moveEvent);

      expect(status?.textContent).toBe('#test-element');
    });
  });
});
