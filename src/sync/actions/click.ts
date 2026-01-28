import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.click(options) or locator.dblclick(options) */
export async function executeClick(page: Page, action: Action): Promise<void> {
  if (action.type !== 'click') return;
  const locator = page.locator(action.selector);
  // Only build options object if any options are specified
  const hasOptions = action.button || action.modifiers || action.timeout;
  if (hasOptions) {
    const options: {
      button?: 'left' | 'right' | 'middle';
      modifiers?: ('Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift')[];
      timeout?: number;
    } = {};
    if (action.button) options.button = action.button;
    if (action.modifiers) options.modifiers = action.modifiers;
    if (action.timeout) options.timeout = action.timeout;
    await (action.doubleClick ? locator.dblclick(options) : locator.click(options));
  } else {
    await (action.doubleClick ? locator.dblclick() : locator.click());
  }
}
