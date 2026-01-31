/**
 * EventInterceptor Unit Tests
 *
 * Tests for the central event interception module.
 * Uses jsdom for fast, isolated testing of event handling logic.
 *
 * @see .claude/EDITOR_ARCHITECTURE.md
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventInterceptor, type InterceptorMode } from '../eventInterceptor';

describe('EventInterceptor', () => {
  let interceptor: EventInterceptor;
  let heroshotRoot: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';

    // Create heroshot root element (simulates toolbar container)
    heroshotRoot = document.createElement('div');
    heroshotRoot.id = 'heroshot-root';
    document.body.appendChild(heroshotRoot);

    // Create a button inside heroshot root
    const toolbarButton = document.createElement('button');
    toolbarButton.id = 'heroshot-picker-btn';
    heroshotRoot.appendChild(toolbarButton);

    // Create page content
    const pageContent = document.createElement('div');
    pageContent.id = 'page-content';
    const pageButton = document.createElement('button');
    pageButton.id = 'page-button';
    pageContent.appendChild(pageButton);
    document.body.appendChild(pageContent);

    interceptor = new EventInterceptor();
  });

  afterEach(() => {
    interceptor.destroy();
  });

  describe('initialization', () => {
    it('should start in idle mode', () => {
      expect(interceptor.getMode()).toBe('idle');
    });

    it('should register capture-phase event listeners on init', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      interceptor.init();

      // Should register listeners for various event types
      const captureListeners = addEventListenerSpy.mock.calls.filter(
        call => call[2] === true || (typeof call[2] === 'object' && call[2]?.capture === true)
      );

      expect(captureListeners.length).toBeGreaterThan(0);

      addEventListenerSpy.mockRestore();
    });

    it('should register bubble-phase listeners on heroshot-root', () => {
      const addEventListenerSpy = vi.spyOn(heroshotRoot, 'addEventListener');

      interceptor.init();

      // Should register bubble-phase listeners on heroshot-root
      const bubbleListeners = addEventListenerSpy.mock.calls.filter(
        call => call[2] === false || (typeof call[2] === 'object' && call[2]?.capture === false)
      );

      expect(bubbleListeners.length).toBeGreaterThan(0);

      addEventListenerSpy.mockRestore();
    });
  });

  describe('mode switching', () => {
    beforeEach(() => {
      interceptor.init();
    });

    it('should switch to picker mode', () => {
      interceptor.setMode('picker');
      expect(interceptor.getMode()).toBe('picker');
    });

    it('should switch to recording mode', () => {
      interceptor.setMode('recording');
      expect(interceptor.getMode()).toBe('recording');
    });

    it('should switch back to idle mode', () => {
      interceptor.setMode('picker');
      interceptor.setMode('idle');
      expect(interceptor.getMode()).toBe('idle');
    });

    it('should emit mode-change event when mode changes', () => {
      const callback = vi.fn();
      interceptor.onModeChange(callback);

      interceptor.setMode('picker');

      expect(callback).toHaveBeenCalledWith('picker', 'idle');
    });

    it('should not emit mode-change event when setting same mode', () => {
      const callback = vi.fn();
      interceptor.onModeChange(callback);

      interceptor.setMode('idle'); // Already idle

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('toolbar event blocking', () => {
    beforeEach(() => {
      interceptor.init();
    });

    it('should block click events from heroshot-root from reaching page handlers', () => {
      const pageClickHandler = vi.fn();
      document.addEventListener('click', pageClickHandler);

      // Create and dispatch click event from toolbar button
      const toolbarButton = document.getElementById('heroshot-picker-btn')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      toolbarButton.dispatchEvent(event);

      // Page handler should NOT have been called because bubble-phase handler stops propagation
      expect(pageClickHandler).not.toHaveBeenCalled();

      document.removeEventListener('click', pageClickHandler);
    });

    it('should block mousedown events from heroshot-root', () => {
      const pageHandler = vi.fn();
      document.addEventListener('mousedown', pageHandler);

      const toolbarButton = document.getElementById('heroshot-picker-btn')!;
      const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      toolbarButton.dispatchEvent(event);

      expect(pageHandler).not.toHaveBeenCalled();

      document.removeEventListener('mousedown', pageHandler);
    });

    it('should allow heroshot internal handlers to process events', () => {
      // Add a handler inside heroshot-root
      const internalHandler = vi.fn();
      const toolbarButton = document.getElementById('heroshot-picker-btn')!;
      toolbarButton.addEventListener('click', internalHandler);

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      toolbarButton.dispatchEvent(event);

      // Internal handler SHOULD be called (event reaches target)
      expect(internalHandler).toHaveBeenCalled();

      toolbarButton.removeEventListener('click', internalHandler);
    });

    it('should block events from nested heroshot elements', () => {
      // Create nested element inside heroshot root
      const nestedDiv = document.createElement('div');
      nestedDiv.className = 'heroshot-inner';
      const nestedButton = document.createElement('button');
      nestedDiv.appendChild(nestedButton);
      heroshotRoot.appendChild(nestedDiv);

      const pageHandler = vi.fn();
      document.addEventListener('click', pageHandler);

      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      nestedButton.dispatchEvent(event);

      expect(pageHandler).not.toHaveBeenCalled();

      document.removeEventListener('click', pageHandler);
    });

    it('should block toolbar events regardless of mode', () => {
      const pageHandler = vi.fn();
      document.addEventListener('click', pageHandler);

      const modes: InterceptorMode[] = ['idle', 'recording', 'picker'];

      for (const mode of modes) {
        interceptor.setMode(mode);
        pageHandler.mockClear();

        const toolbarButton = document.getElementById('heroshot-picker-btn')!;
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        toolbarButton.dispatchEvent(event);

        expect(pageHandler).not.toHaveBeenCalled();
      }

      document.removeEventListener('click', pageHandler);
    });
  });

  describe('page events in idle mode', () => {
    beforeEach(() => {
      interceptor.init();
      interceptor.setMode('idle');
    });

    it('should allow click events from page elements', () => {
      const pageHandler = vi.fn();
      document.addEventListener('click', pageHandler);

      const pageButton = document.getElementById('page-button')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      pageButton.dispatchEvent(event);

      expect(pageHandler).toHaveBeenCalled();

      document.removeEventListener('click', pageHandler);
    });

    it('should allow keyboard events from page', () => {
      const pageHandler = vi.fn();
      document.addEventListener('keydown', pageHandler);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      document.body.dispatchEvent(event);

      expect(pageHandler).toHaveBeenCalled();

      document.removeEventListener('keydown', pageHandler);
    });
  });

  describe('page events in picker mode', () => {
    beforeEach(() => {
      interceptor.init();
      interceptor.setMode('picker');
    });

    /**
     * Note: EventInterceptor does NOT block page events in picker mode.
     * It only calls preventDefault() to stop default browser actions.
     * The actual blocking is done by ElementPicker's capture handler
     * which calls stopImmediatePropagation().
     *
     * These tests verify EventInterceptor's behavior in isolation.
     * Full picker blocking is tested in E2E tests with ElementPicker present.
     */

    it('should allow click events to propagate (ElementPicker will block them)', () => {
      const pageHandler = vi.fn();
      document.addEventListener('click', pageHandler);

      const pageButton = document.getElementById('page-button')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      pageButton.dispatchEvent(event);

      // EventInterceptor lets clicks through for ElementPicker to process
      expect(pageHandler).toHaveBeenCalled();

      document.removeEventListener('click', pageHandler);
    });

    it('should prevent default on page events', () => {
      const pageButton = document.getElementById('page-button')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      pageButton.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it('should allow keyboard events to propagate (ElementPicker will handle ESC)', () => {
      const pageHandler = vi.fn();
      document.addEventListener('keydown', pageHandler);

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      document.body.dispatchEvent(event);

      // EventInterceptor lets keyboard events through for ElementPicker
      expect(pageHandler).toHaveBeenCalled();

      document.removeEventListener('keydown', pageHandler);
    });

    it('should allow focus events to propagate in picker mode', () => {
      const pageHandler = vi.fn();
      document.addEventListener('focus', pageHandler, true);

      const pageButton = document.getElementById('page-button')!;
      const event = new FocusEvent('focus', { bubbles: true, cancelable: true });
      pageButton.dispatchEvent(event);

      // Focus events are allowed through (they're natural browser behavior)
      expect(pageHandler).toHaveBeenCalled();

      document.removeEventListener('focus', pageHandler, true);
    });

    it('should allow input events to propagate in picker mode', () => {
      const input = document.createElement('input');
      document.getElementById('page-content')!.appendChild(input);

      const pageHandler = vi.fn();
      document.addEventListener('input', pageHandler);

      const event = new InputEvent('input', { bubbles: true, cancelable: true });
      input.dispatchEvent(event);

      // Input events are allowed through (ElementPicker will handle element selection)
      expect(pageHandler).toHaveBeenCalled();

      document.removeEventListener('input', pageHandler);
    });
  });

  describe('page events in recording mode', () => {
    beforeEach(() => {
      interceptor.init();
      interceptor.setMode('recording');
    });

    it('should allow click events from page elements', () => {
      const pageHandler = vi.fn();
      document.addEventListener('click', pageHandler);

      const pageButton = document.getElementById('page-button')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      pageButton.dispatchEvent(event);

      expect(pageHandler).toHaveBeenCalled();

      document.removeEventListener('click', pageHandler);
    });

    it('should emit event for recording when page event occurs', () => {
      const recordCallback = vi.fn();
      interceptor.onPageEvent(recordCallback);

      const pageButton = document.getElementById('page-button')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      pageButton.dispatchEvent(event);

      expect(recordCallback).toHaveBeenCalledWith(event);
    });

    it('should not emit event for recording when toolbar event occurs', () => {
      const recordCallback = vi.fn();
      interceptor.onPageEvent(recordCallback);

      const toolbarButton = document.getElementById('heroshot-picker-btn')!;
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      toolbarButton.dispatchEvent(event);

      expect(recordCallback).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      interceptor.init();
      interceptor.destroy();

      expect(removeEventListenerSpy.mock.calls.length).toBeGreaterThan(0);

      removeEventListenerSpy.mockRestore();
    });

    it('should reset mode to idle on destroy', () => {
      interceptor.init();
      interceptor.setMode('picker');
      interceptor.destroy();

      expect(interceptor.getMode()).toBe('idle');
    });
  });

  describe('isHeroshotElement helper', () => {
    beforeEach(() => {
      interceptor.init();
    });

    it('should identify heroshot-root as heroshot element', () => {
      expect(interceptor.isHeroshotElement(heroshotRoot)).toBe(true);
    });

    it('should identify elements inside heroshot-root', () => {
      const toolbarButton = document.getElementById('heroshot-picker-btn')!;
      expect(interceptor.isHeroshotElement(toolbarButton)).toBe(true);
    });

    it('should not identify page elements as heroshot', () => {
      const pageButton = document.getElementById('page-button')!;
      expect(interceptor.isHeroshotElement(pageButton)).toBe(false);
    });

    it('should handle null gracefully', () => {
      expect(interceptor.isHeroshotElement(null)).toBe(false);
    });
  });
});
