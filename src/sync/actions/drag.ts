import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: startLocator.dragTo(endLocator) */
export async function executeDrag(page: Page, action: Action): Promise<void> {
  if (action.type !== 'drag') return;
  const from = page.locator(action.from);
  const to = page.locator(action.to);
  await (action.timeout ? from.dragTo(to, { timeout: action.timeout }) : from.dragTo(to));
}
