/**
 * EventRecorder Unit Tests
 *
 * Tests for recording user interactions and converting them to Action objects.
 * Used for action recording in the editor.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRecorder, type RecordedAction } from '../eventRecorder';

describe('EventRecorder', () => {
  let recorder: EventRecorder;
  let container: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    recorder = new EventRecorder();
  });

  afterEach(() => {
    recorder.destroy();
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  describe('recording lifecycle', () => {
    it('should start in non-recording state', () => {
      expect(recorder.isRecording()).toBe(false);
    });

    it('should start recording when startRecording is called', () => {
      recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);
    });

    it('should stop recording and return actions', () => {
      recorder.startRecording();
      expect(recorder.isRecording()).toBe(true);

      const actions = recorder.stopRecording();
      expect(recorder.isRecording()).toBe(false);
      expect(Array.isArray(actions)).toBe(true);
    });

    it('should clear actions between sessions', () => {
      recorder.startRecording();
      // Simulate a click
      const button = document.createElement('button');
      button.textContent = 'Click me';
      container.appendChild(button);
      recorder.processEvent(new MouseEvent('click', { bubbles: true }), button);

      let actions = recorder.stopRecording();
      expect(actions.length).toBe(1);

      recorder.startRecording();
      actions = recorder.stopRecording();
      expect(actions.length).toBe(0);
    });

    it('should ignore events when not recording', () => {
      const button = document.createElement('button');
      button.textContent = 'Click me';
      container.appendChild(button);

      recorder.processEvent(new MouseEvent('click', { bubbles: true }), button);
      expect(recorder.getActions().length).toBe(0);
    });
  });

  describe('click recording', () => {
    it('should record click with selector', () => {
      const button = document.createElement('button');
      button.setAttribute('data-testid', 'submit-btn');
      container.appendChild(button);

      recorder.startRecording();
      recorder.processEvent(new MouseEvent('click', { bubbles: true }), button);

      const actions = recorder.getActions();
      expect(actions.length).toBe(1);
      expect(actions[0]?.type).toBe('click');
      expect(actions[0]?.selector).toBe('[data-testid="submit-btn"]');
    });

    it('should record double click', () => {
      const button = document.createElement('button');
      button.textContent = 'Double click';
      container.appendChild(button);

      recorder.startRecording();
      recorder.processEvent(new MouseEvent('dblclick', { bubbles: true }), button);

      const actions = recorder.getActions();
      expect(actions.length).toBe(1);
      expect(actions[0]?.type).toBe('click');
      expect((actions[0] as { doubleClick?: boolean }).doubleClick).toBe(true);
    });

    it('should not record heroshot UI clicks', () => {
      const heroshotRoot = document.createElement('div');
      heroshotRoot.id = 'heroshot-root';
      document.body.appendChild(heroshotRoot);

      const button = document.createElement('button');
      heroshotRoot.appendChild(button);

      recorder.startRecording();
      recorder.processEvent(new MouseEvent('click', { bubbles: true }), button);

      expect(recorder.getActions().length).toBe(0);
    });

    it('should use smart selector for click target', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit Form';
      container.appendChild(button);

      recorder.startRecording();
      recorder.processEvent(new MouseEvent('click', { bubbles: true }), button);

      const actions = recorder.getActions();
      expect(actions[0]?.selector).toBe('role=button[name="Submit Form"]');
    });
  });

  describe('type recording', () => {
    it('should record type action for input', () => {
      vi.useFakeTimers();
      const input = document.createElement('input');
      input.setAttribute('data-testid', 'email');
      input.value = 'test@example.com';
      container.appendChild(input);

      recorder.startRecording();
      recorder.processEvent(new InputEvent('input', { bubbles: true }), input);
      vi.advanceTimersByTime(500); // Wait for debounce

      const actions = recorder.getActions();
      expect(actions.length).toBe(1);
      expect(actions[0]?.type).toBe('type');
      expect((actions[0] as { text?: string }).text).toBe('test@example.com');
    });

    it('should debounce rapid typing', () => {
      vi.useFakeTimers();
      const input = document.createElement('input');
      input.placeholder = 'Search';
      container.appendChild(input);

      recorder.startRecording();

      // Simulate typing "hello" one character at a time
      input.value = 'h';
      recorder.processEvent(new InputEvent('input', { bubbles: true }), input);
      vi.advanceTimersByTime(50);

      input.value = 'he';
      recorder.processEvent(new InputEvent('input', { bubbles: true }), input);
      vi.advanceTimersByTime(50);

      input.value = 'hel';
      recorder.processEvent(new InputEvent('input', { bubbles: true }), input);
      vi.advanceTimersByTime(50);

      input.value = 'hell';
      recorder.processEvent(new InputEvent('input', { bubbles: true }), input);
      vi.advanceTimersByTime(50);

      input.value = 'hello';
      recorder.processEvent(new InputEvent('input', { bubbles: true }), input);

      // Before debounce timeout
      expect(recorder.getActions().length).toBe(0);

      // After debounce timeout
      vi.advanceTimersByTime(500);
      const actions = recorder.getActions();
      expect(actions.length).toBe(1);
      expect((actions[0] as { text?: string }).text).toBe('hello');
    });

    it('should flush on blur', () => {
      vi.useFakeTimers();
      const input = document.createElement('input');
      input.placeholder = 'Username';
      input.value = 'john';
      container.appendChild(input);

      recorder.startRecording();
      recorder.processEvent(new InputEvent('input', { bubbles: true }), input);

      // Trigger blur before debounce
      recorder.processEvent(new FocusEvent('blur', { bubbles: true }), input);

      const actions = recorder.getActions();
      expect(actions.length).toBe(1);
      expect((actions[0] as { text?: string }).text).toBe('john');
    });

    it('should record textarea input', () => {
      vi.useFakeTimers();
      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Message';
      textarea.value = 'Hello world';
      container.appendChild(textarea);

      recorder.startRecording();
      recorder.processEvent(new InputEvent('input', { bubbles: true }), textarea);
      vi.advanceTimersByTime(500);

      const actions = recorder.getActions();
      expect(actions[0]?.type).toBe('type');
    });
  });

  describe('select recording', () => {
    it('should record single selection', () => {
      const select = document.createElement('select');
      select.innerHTML = `
        <option value="a">Option A</option>
        <option value="b" selected>Option B</option>
        <option value="c">Option C</option>
      `;
      container.appendChild(select);

      recorder.startRecording();
      recorder.processEvent(new Event('change', { bubbles: true }), select);

      const actions = recorder.getActions();
      expect(actions.length).toBe(1);
      expect(actions[0]?.type).toBe('select_option');
      expect((actions[0] as { values?: string[] }).values).toEqual(['b']);
    });

    it('should record multi-selection', () => {
      const select = document.createElement('select');
      select.multiple = true;
      select.innerHTML = `
        <option value="a" selected>Option A</option>
        <option value="b">Option B</option>
        <option value="c" selected>Option C</option>
      `;
      container.appendChild(select);

      recorder.startRecording();
      recorder.processEvent(new Event('change', { bubbles: true }), select);

      const actions = recorder.getActions();
      expect((actions[0] as { values?: string[] }).values).toEqual(['a', 'c']);
    });
  });

  describe('keyboard recording', () => {
    it('should record special keys', () => {
      const input = document.createElement('input');
      container.appendChild(input);

      recorder.startRecording();
      recorder.processEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }), input);

      const actions = recorder.getActions();
      expect(actions.length).toBe(1);
      expect(actions[0]?.type).toBe('press_key');
      expect((actions[0] as { key?: string }).key).toBe('Enter');
    });

    it('should record Escape key', () => {
      recorder.startRecording();
      recorder.processEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        document.body
      );

      const actions = recorder.getActions();
      expect(actions[0]?.type).toBe('press_key');
      expect((actions[0] as { key?: string }).key).toBe('Escape');
    });

    it('should record Tab key', () => {
      const input = document.createElement('input');
      container.appendChild(input);

      recorder.startRecording();
      recorder.processEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }), input);

      const actions = recorder.getActions();
      expect((actions[0] as { key?: string }).key).toBe('Tab');
    });

    it('should ignore regular character keys during typing', () => {
      vi.useFakeTimers();
      const input = document.createElement('input');
      input.value = 'a';
      container.appendChild(input);

      recorder.startRecording();
      // Character key
      recorder.processEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }), input);

      // Should not record character keys as press_key
      const actions = recorder.getActions();
      expect(actions.filter(a => a.type === 'press_key').length).toBe(0);
    });

    it('should record key combinations', () => {
      recorder.startRecording();
      recorder.processEvent(
        new KeyboardEvent('keydown', {
          key: 'a',
          ctrlKey: true,
          bubbles: true,
        }),
        document.body
      );

      const actions = recorder.getActions();
      expect(actions[0]?.type).toBe('press_key');
      expect((actions[0] as { key?: string }).key).toBe('Control+a');
    });
  });

  describe('action callbacks', () => {
    it('should notify on action added', () => {
      const callback = vi.fn();
      recorder.onActionAdded(callback);

      const button = document.createElement('button');
      button.textContent = 'Test';
      container.appendChild(button);

      recorder.startRecording();
      recorder.processEvent(new MouseEvent('click', { bubbles: true }), button);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
    });

    it('should unsubscribe from action callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = recorder.onActionAdded(callback);
      unsubscribe();

      const button = document.createElement('button');
      button.textContent = 'Test';
      container.appendChild(button);

      recorder.startRecording();
      recorder.processEvent(new MouseEvent('click', { bubbles: true }), button);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('action ordering', () => {
    it('should preserve action order', () => {
      vi.useFakeTimers();
      const input = document.createElement('input');
      input.setAttribute('data-testid', 'search');
      container.appendChild(input);

      const button = document.createElement('button');
      button.setAttribute('data-testid', 'submit');
      container.appendChild(button);

      recorder.startRecording();

      // Type in input
      input.value = 'test';
      recorder.processEvent(new InputEvent('input', { bubbles: true }), input);
      vi.advanceTimersByTime(500); // Flush debounce

      // Click button
      recorder.processEvent(new MouseEvent('click', { bubbles: true }), button);

      const actions = recorder.getActions();
      expect(actions.length).toBe(2);
      expect(actions[0]?.type).toBe('type');
      expect(actions[1]?.type).toBe('click');
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no selector gracefully', () => {
      const div = document.createElement('div');
      container.appendChild(div);

      recorder.startRecording();
      recorder.processEvent(new MouseEvent('click', { bubbles: true }), div);

      const actions = recorder.getActions();
      expect(actions.length).toBe(1);
      expect(actions[0]?.selector).toBeTruthy();
    });

    it('should handle null/undefined target', () => {
      recorder.startRecording();
      // Should not throw
      expect(() => {
        recorder.processEvent(new MouseEvent('click'), null as unknown as Element);
      }).not.toThrow();
      expect(recorder.getActions().length).toBe(0);
    });

    it('should handle rapid stop/start cycles', () => {
      recorder.startRecording();
      recorder.stopRecording();
      recorder.startRecording();
      recorder.stopRecording();
      recorder.startRecording();

      expect(recorder.isRecording()).toBe(true);
    });
  });
});
