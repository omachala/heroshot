import type { Page } from 'playwright';
import type { Action } from './types';

/** MCP: page.setViewportSize({ width, height }) */
export async function executeResize(page: Page, action: Action): Promise<void> {
  if (action.type !== 'resize') return;
  await page.setViewportSize({ width: action.width, height: action.height });
}
