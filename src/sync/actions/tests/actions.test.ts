import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeActions } from '..';
import type { Action } from '../types';

/** Create a mock Playwright Page with all methods stubbed */
function createMockPage() {
  const mockLocator = {
    click: vi.fn().mockResolvedValue(undefined),
    dblclick: vi.fn().mockResolvedValue(undefined),
    hover: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    pressSequentially: vi.fn().mockResolvedValue(undefined),
    selectOption: vi.fn().mockResolvedValue(undefined),
    dragTo: vi.fn().mockResolvedValue(undefined),
    setInputFiles: vi.fn().mockResolvedValue(undefined),
    setChecked: vi.fn().mockResolvedValue(undefined),
    check: vi.fn().mockResolvedValue(undefined),
    evaluateAll: vi.fn().mockResolvedValue(undefined),
  };

  const mockTextLocator = {
    first: vi.fn().mockReturnValue({
      waitFor: vi.fn().mockResolvedValue(undefined),
    }),
  };

  const page = {
    locator: vi.fn().mockReturnValue(mockLocator),
    keyboard: { press: vi.fn().mockResolvedValue(undefined) },
    goto: vi.fn().mockResolvedValue(undefined),
    goBack: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    getByText: vi.fn().mockReturnValue(mockTextLocator),
    setViewportSize: vi.fn().mockResolvedValue(undefined),
    once: vi.fn(),
  };

  return { page, mockLocator, mockTextLocator };
}

describe('executeActions', () => {
  let page: ReturnType<typeof createMockPage>['page'];
  let mockLocator: ReturnType<typeof createMockPage>['mockLocator'];
  let mockTextLocator: ReturnType<typeof createMockPage>['mockTextLocator'];

  beforeEach(() => {
    ({ page, mockLocator, mockTextLocator } = createMockPage());
  });

  it('executes empty actions array without error', async () => {
    await executeActions(page as never, []);
    expect(page.locator).not.toHaveBeenCalled();
  });

  describe('click', () => {
    it('clicks an element', async () => {
      const actions: Action[] = [{ type: 'click', selector: '.btn' }];
      await executeActions(page as never, actions);
      expect(page.locator).toHaveBeenCalledWith('.btn');
      expect(mockLocator.click).toHaveBeenCalled();
    });

    it('double-clicks an element', async () => {
      const actions: Action[] = [{ type: 'click', selector: '.card', doubleClick: true }];
      await executeActions(page as never, actions);
      expect(mockLocator.dblclick).toHaveBeenCalled();
    });

    it('passes button and modifiers', async () => {
      const actions: Action[] = [
        { type: 'click', selector: '.menu', button: 'right', modifiers: ['Control'] },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.click).toHaveBeenCalledWith({
        button: 'right',
        modifiers: ['Control'],
      });
    });

    it('passes timeout option when specified', async () => {
      const actions: Action[] = [{ type: 'click', selector: '.btn', timeout: 5000 }];
      await executeActions(page as never, actions);
      expect(mockLocator.click).toHaveBeenCalledWith({ timeout: 5000 });
    });
  });

  describe('type', () => {
    it('fills text into an element', async () => {
      const actions: Action[] = [{ type: 'type', selector: '#email', text: 'test@example.com' }];
      await executeActions(page as never, actions);
      expect(page.locator).toHaveBeenCalledWith('#email');
      expect(mockLocator.fill).toHaveBeenCalledWith('test@example.com');
    });

    it('types slowly with pressSequentially', async () => {
      const actions: Action[] = [
        { type: 'type', selector: '#search', text: 'query', slowly: true },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.pressSequentially).toHaveBeenCalledWith('query');
    });

    it('presses Enter when submit is true', async () => {
      const actions: Action[] = [
        { type: 'type', selector: '#search', text: 'query', submit: true },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.fill).toHaveBeenCalledWith('query');
      expect(page.keyboard.press).toHaveBeenCalledWith('Enter');
    });

    it('passes timeout option when specified', async () => {
      const actions: Action[] = [
        { type: 'type', selector: '#email', text: 'test@example.com', timeout: 10000 },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.fill).toHaveBeenCalledWith('test@example.com', { timeout: 10000 });
    });
  });

  describe('hover', () => {
    it('hovers over an element', async () => {
      const actions: Action[] = [{ type: 'hover', selector: '.tooltip-trigger' }];
      await executeActions(page as never, actions);
      expect(page.locator).toHaveBeenCalledWith('.tooltip-trigger');
      expect(mockLocator.hover).toHaveBeenCalled();
    });

    it('passes timeout option when specified', async () => {
      const actions: Action[] = [{ type: 'hover', selector: '.menu', timeout: 5000 }];
      await executeActions(page as never, actions);
      expect(mockLocator.hover).toHaveBeenCalledWith({ timeout: 5000 });
    });
  });

  describe('select_option', () => {
    it('selects options in a dropdown', async () => {
      const actions: Action[] = [{ type: 'select_option', selector: '#country', values: ['us'] }];
      await executeActions(page as never, actions);
      expect(page.locator).toHaveBeenCalledWith('#country');
      expect(mockLocator.selectOption).toHaveBeenCalledWith(['us']);
    });

    it('passes timeout option when specified', async () => {
      const actions: Action[] = [
        { type: 'select_option', selector: '#country', values: ['us'], timeout: 5000 },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.selectOption).toHaveBeenCalledWith(['us'], { timeout: 5000 });
    });
  });

  describe('press_key', () => {
    it('presses a key', async () => {
      const actions: Action[] = [{ type: 'press_key', key: 'Escape' }];
      await executeActions(page as never, actions);
      expect(page.keyboard.press).toHaveBeenCalledWith('Escape');
    });

    it('presses key combinations', async () => {
      const actions: Action[] = [{ type: 'press_key', key: 'Control+a' }];
      await executeActions(page as never, actions);
      expect(page.keyboard.press).toHaveBeenCalledWith('Control+a');
    });
  });

  describe('drag', () => {
    it('drags from one element to another', async () => {
      const targetLocator = { ...mockLocator };
      page.locator.mockReturnValueOnce(mockLocator).mockReturnValueOnce(targetLocator);

      const actions: Action[] = [{ type: 'drag', from: '.item', to: '.drop-zone' }];
      await executeActions(page as never, actions);
      expect(page.locator).toHaveBeenCalledWith('.item');
      expect(page.locator).toHaveBeenCalledWith('.drop-zone');
      expect(mockLocator.dragTo).toHaveBeenCalledWith(targetLocator);
    });

    it('passes timeout option when specified', async () => {
      const targetLocator = { ...mockLocator };
      page.locator.mockReturnValueOnce(mockLocator).mockReturnValueOnce(targetLocator);

      const actions: Action[] = [{ type: 'drag', from: '.item', to: '.drop-zone', timeout: 10000 }];
      await executeActions(page as never, actions);
      expect(mockLocator.dragTo).toHaveBeenCalledWith(targetLocator, { timeout: 10000 });
    });
  });

  describe('wait', () => {
    it('waits for specified time (capped at 30s)', async () => {
      const actions: Action[] = [{ type: 'wait', time: 0.5 }];
      await executeActions(page as never, actions);
      expect(page.waitForTimeout).toHaveBeenCalledWith(500);
    });

    it('caps wait time at 30 seconds', async () => {
      const actions: Action[] = [{ type: 'wait', time: 60 }];
      await executeActions(page as never, actions);
      expect(page.waitForTimeout).toHaveBeenCalledWith(30_000);
    });

    it('waits for text to appear', async () => {
      const actions: Action[] = [{ type: 'wait', text: 'Dashboard loaded' }];
      await executeActions(page as never, actions);
      expect(page.getByText).toHaveBeenCalledWith('Dashboard loaded');
      expect(mockTextLocator.first).toHaveBeenCalled();
      expect(mockTextLocator.first().waitFor).toHaveBeenCalledWith({ state: 'visible' });
    });

    it('waits for text to disappear', async () => {
      const actions: Action[] = [{ type: 'wait', textGone: 'Loading...' }];
      await executeActions(page as never, actions);
      expect(page.getByText).toHaveBeenCalledWith('Loading...');
      expect(mockTextLocator.first().waitFor).toHaveBeenCalledWith({ state: 'hidden' });
    });
  });

  describe('navigate', () => {
    it('navigates to a URL', async () => {
      const actions: Action[] = [{ type: 'navigate', url: '/settings' }];
      await executeActions(page as never, actions);
      expect(page.goto).toHaveBeenCalledWith('/settings', { waitUntil: 'domcontentloaded' });
    });

    it('navigates back', async () => {
      const actions: Action[] = [{ type: 'navigate', back: true }];
      await executeActions(page as never, actions);
      expect(page.goBack).toHaveBeenCalled();
    });
  });

  describe('evaluate', () => {
    it('evaluates a function at page level', async () => {
      const actions: Action[] = [
        { type: 'evaluate', function: "() => { document.title = 'Test' }" },
      ];
      await executeActions(page as never, actions);
      expect(page.evaluate).toHaveBeenCalledWith("(() => { document.title = 'Test' })()");
    });

    it('evaluates a function with selector', async () => {
      const actions: Action[] = [
        {
          type: 'evaluate',
          selector: '.counter',
          function: "(el) => { el.textContent = '42' }",
        },
      ];
      await executeActions(page as never, actions);
      expect(page.evaluate).toHaveBeenCalledWith(
        "((el) => { el.textContent = '42' })(document.querySelector('.counter'))"
      );
    });

    it('escapes single quotes in selector', async () => {
      const actions: Action[] = [
        {
          type: 'evaluate',
          selector: "[data-id='test']",
          function: '(el) => el.remove()',
        },
      ];
      await executeActions(page as never, actions);
      expect(page.evaluate).toHaveBeenCalledWith(
        String.raw`((el) => el.remove())(document.querySelector('[data-id=\'test\']'))`
      );
    });
  });

  describe('fill_form', () => {
    it('fills a textbox field', async () => {
      const actions: Action[] = [
        {
          type: 'fill_form',
          fields: [{ selector: '#name', value: 'John', fieldType: 'textbox' }],
        },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.fill).toHaveBeenCalledWith('John');
    });

    it('checks a checkbox', async () => {
      const actions: Action[] = [
        {
          type: 'fill_form',
          fields: [{ selector: '#agree', value: 'true', fieldType: 'checkbox' }],
        },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.setChecked).toHaveBeenCalledWith(true);
    });

    it('unchecks a checkbox', async () => {
      const actions: Action[] = [
        {
          type: 'fill_form',
          fields: [{ selector: '#agree', value: 'false', fieldType: 'checkbox' }],
        },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.setChecked).toHaveBeenCalledWith(false);
    });

    it('selects a radio button', async () => {
      const actions: Action[] = [
        {
          type: 'fill_form',
          fields: [{ selector: '#option-a', value: 'a', fieldType: 'radio' }],
        },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.check).toHaveBeenCalled();
    });

    it('selects a combobox option by label', async () => {
      const actions: Action[] = [
        {
          type: 'fill_form',
          fields: [{ selector: '#country', value: 'United States', fieldType: 'combobox' }],
        },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.selectOption).toHaveBeenCalledWith({ label: 'United States' });
    });

    it('passes timeout option when specified', async () => {
      const actions: Action[] = [
        {
          type: 'fill_form',
          fields: [{ selector: '#email', value: 'test@example.com', fieldType: 'textbox' }],
          timeout: 10000,
        },
      ];
      await executeActions(page as never, actions);
      expect(mockLocator.fill).toHaveBeenCalledWith('test@example.com', { timeout: 10000 });
    });
  });

  describe('handle_dialog', () => {
    it('registers a dialog accept handler', async () => {
      const actions: Action[] = [{ type: 'handle_dialog', accept: true }];
      await executeActions(page as never, actions);
      expect(page.once).toHaveBeenCalledWith('dialog', expect.any(Function));
    });

    it('registers a dialog dismiss handler', async () => {
      const actions: Action[] = [{ type: 'handle_dialog', accept: false }];
      await executeActions(page as never, actions);
      expect(page.once).toHaveBeenCalledWith('dialog', expect.any(Function));
    });
  });

  describe('file_upload', () => {
    it('sets input files on element', async () => {
      const actions: Action[] = [
        { type: 'file_upload', selector: 'input[type=file]', paths: ['./image.png'] },
      ];
      await executeActions(page as never, actions);
      expect(page.locator).toHaveBeenCalledWith('input[type=file]');
      expect(mockLocator.setInputFiles).toHaveBeenCalledWith(['./image.png']);
    });
  });

  describe('resize', () => {
    it('resizes the viewport', async () => {
      const actions: Action[] = [{ type: 'resize', width: 375, height: 667 }];
      await executeActions(page as never, actions);
      expect(page.setViewportSize).toHaveBeenCalledWith({ width: 375, height: 667 });
    });
  });

  describe('hide', () => {
    it('hides elements by selector', async () => {
      const actions: Action[] = [{ type: 'hide', selectors: ['.cookie-banner'] }];
      await executeActions(page as never, actions);
      expect(page.locator).toHaveBeenCalledWith('.cookie-banner');
      expect(mockLocator.evaluateAll).toHaveBeenCalled();
    });

    it('hides multiple selectors', async () => {
      const actions: Action[] = [
        { type: 'hide', selectors: ['.cookie-banner', '.chat-widget', '.ad-container'] },
      ];
      await executeActions(page as never, actions);
      expect(page.locator).toHaveBeenCalledWith('.cookie-banner');
      expect(page.locator).toHaveBeenCalledWith('.chat-widget');
      expect(page.locator).toHaveBeenCalledWith('.ad-container');
      expect(mockLocator.evaluateAll).toHaveBeenCalledTimes(3);
    });
  });

  describe('sequential execution', () => {
    it('executes multiple actions in order', async () => {
      const callOrder: string[] = [];
      page.locator.mockImplementation(() => {
        callOrder.push('locator');
        return mockLocator;
      });
      mockLocator.click.mockImplementation(async () => {
        callOrder.push('click');
      });
      mockLocator.fill.mockImplementation(async () => {
        callOrder.push('fill');
      });

      const actions: Action[] = [
        { type: 'click', selector: '.btn' },
        { type: 'type', selector: '#input', text: 'hello' },
      ];
      await executeActions(page as never, actions);

      expect(callOrder).toEqual(['locator', 'click', 'locator', 'fill']);
    });
  });
});
