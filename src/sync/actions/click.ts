import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: locator.click(options) or locator.dblclick(options) */
export async function executeClick(page: Page, action: Action): Promise<void> {
  if (action.type !== 'click') return;
  const locator = page.locator(action.selector);
  const options: {
    button?: 'left' | 'right' | 'middle';
    modifiers?: ('Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift')[];
  } = {};
  if (action.button) options.button = action.button;
  if (action.modifiers) options.modifiers = action.modifiers;
  await (action.doubleClick ? locator.dblclick(options) : locator.click(options));
}
