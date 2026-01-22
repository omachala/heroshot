import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: startLocator.dragTo(endLocator) */
export async function executeDrag(page: Page, action: Action): Promise<void> {
  if (action.type !== 'drag') return;
  await page.locator(action.from).dragTo(page.locator(action.to));
}
