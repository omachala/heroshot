import type { Browser, BrowserContext } from 'playwright';
import { saveSession } from '../session';
import { verbose } from '../ui';
import { dispatchHighlightJob } from './pageScripts';
import { saveCurrentConfig } from './saveCurrentConfig';
import type { BrowserSettings, ScreenshotData, ToolbarEvent, ToolbarJob } from './types';

export type BrowserState = {
  allScreenshots: ScreenshotData[];
  pendingJob: ToolbarJob | null;
  selectedId: string | null;
  sidebarExpanded: boolean;
  updatedBrowserSettings: BrowserSettings | null;
  hiddenElements: Record<string, string[]>;
  configPath: string;
  sessionKey: string;
};

export function createEventHandler(
  state: BrowserState,
  browser: Browser,
  context: BrowserContext
): (event: ToolbarEvent) => void {
  const save = () =>
    saveCurrentConfig(
      state.configPath,
      state.allScreenshots,
      state.updatedBrowserSettings,
      state.hiddenElements
    );

  return (event: ToolbarEvent) => {
    switch (event.type) {
      case 'screenshot-added': {
        state.allScreenshots.push(event.data);
        verbose(`Added: ${event.data.name}`);
        save();
        break;
      }
      case 'screenshot-updated': {
        const index = state.allScreenshots.findIndex(({ id }) => id === event.data.id);
        if (index !== -1) {
          state.allScreenshots[index] = event.data;
          verbose(`Updated: ${event.data.name}`);
          save();
        }
        break;
      }
      case 'screenshot-removed': {
        const index = state.allScreenshots.findIndex(({ id }) => id === event.id);
        if (index !== -1) {
          const [removed] = state.allScreenshots.splice(index, 1);
          verbose(`Removed: ${removed?.name ?? event.id}`);
          save();
        }
        break;
      }
      case 'screenshot-selected': {
        const [currentPage] = context.pages();
        if (!currentPage) break;
        state.selectedId = event.id;
        state.sidebarExpanded = true;
        if (currentPage.url() === event.url) {
          state.pendingJob = {
            type: 'highlight',
            selector: event.selector,
            screenshotId: event.id,
          };
          currentPage
            .evaluate(dispatchHighlightJob, { selector: event.selector, screenshotId: event.id })
            // eslint-disable-next-line @typescript-eslint/no-empty-function -- fire and forget
            .catch(() => {});
        } else {
          state.pendingJob = {
            type: 'navigate-and-highlight',
            url: event.url,
            selector: event.selector,
            screenshotId: event.id,
          };
          // eslint-disable-next-line @typescript-eslint/no-empty-function -- fire and forget
          currentPage.goto(event.url, { waitUntil: 'domcontentloaded' }).catch(() => {});
        }
        break;
      }
      case 'settings-updated': {
        state.updatedBrowserSettings = event.data;
        verbose(`Settings updated: ${JSON.stringify(event.data)}`);
        save();
        break;
      }
      case 'hidden-elements-updated': {
        const { domain, selectors } = event;
        state.hiddenElements =
          selectors.length === 0
            ? Object.fromEntries(Object.entries(state.hiddenElements).filter(([k]) => k !== domain))
            : { ...state.hiddenElements, [domain]: selectors };
        verbose(`Hidden elements updated for ${domain}: ${selectors.length} selectors`);
        save();
        break;
      }
      case 'job-complete': {
        state.pendingJob = null;
        break;
      }
      case 'done': {
        void (async () => {
          try {
            const currentStorageState = await context.storageState();
            saveSession(currentStorageState, state.sessionKey);
            verbose('Session saved');
          } catch {
            // Ignore errors - session save is best-effort
          }
          await browser.close();
        })();
        break;
      }
    }
  };
}
