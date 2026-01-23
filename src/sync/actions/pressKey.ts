import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: page.keyboard.press(key) */
export async function executePressKey(page: Page, action: Action): Promise<void> {
  if (action.type !== 'press_key') return;
  await page.keyboard.press(action.key);
}
