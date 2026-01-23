import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: page.goto(url) or page.goBack() */
export async function executeNavigate(page: Page, action: Action): Promise<void> {
  if (action.type !== 'navigate') return;
  if (action.back) {
    await page.goBack();
  } else if (action.url) {
    await page.goto(action.url, { waitUntil: 'domcontentloaded' });
  }
}
