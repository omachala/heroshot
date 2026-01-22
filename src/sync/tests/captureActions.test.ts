import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Screenshot } from '../../types';
import { captureScreenshot } from '../capture';
import type { CaptureOptions } from '../types';

// Mock all dependencies
vi.mock('../actions', () => ({
  executeActions: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../screenshot', () => ({
  takeScreenshot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../elementCapture', () => ({
  captureElementWithOptions: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../pageScripts', () => ({
  applyColorSchemeClass: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  mkdirSync: vi.fn(),
}));

function createMockPage() {
  return {
    goto: vi.fn().mockResolvedValue(undefined),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(undefined),
    emulateMedia: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('')),
  };
}

const baseScreenshot: Screenshot = {
  id: 'test-1',
  name: 'Test Screenshot',
  url: 'https://example.com',
};

const captureOptions: CaptureOptions = {
  format: 'png',
  quality: 80,
  fullPage: true,
};

describe('captureScreenshot — actions integration', () => {
  let page: ReturnType<typeof createMockPage>;
  let executeActionsMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    page = createMockPage();
    const actionsModule = await import('../actions');
    executeActionsMock = actionsModule.executeActions as ReturnType<typeof vi.fn>;
  });

  it('calls executeActions with page and actions after navigation', async () => {
    const actions = [
      { type: 'click' as const, selector: '.btn' },
      { type: 'wait' as const, time: 0.5 },
    ];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(executeActionsMock).toHaveBeenCalledWith(page, actions);
  });

  it('does not call executeActions when actions is undefined', async () => {
    await captureScreenshot(page as never, baseScreenshot, '/tmp/out', captureOptions);

    expect(executeActionsMock).not.toHaveBeenCalled();
  });

  it('does not call executeActions when actions is empty array', async () => {
    const screenshot: Screenshot = { ...baseScreenshot, actions: [] };

    await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(executeActionsMock).not.toHaveBeenCalled();
  });

  it('waits 500ms for page to settle after actions complete', async () => {
    const actions = [{ type: 'click' as const, selector: '.btn' }];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    // waitForTimeout is called during navigation (2000ms) and after actions (500ms)
    const calls = page.waitForTimeout.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain(500);
  });

  it('returns error when an action throws', async () => {
    executeActionsMock.mockRejectedValueOnce(new Error('Element not found: .missing'));
    const actions = [{ type: 'click' as const, selector: '.missing' }];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    const result = await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Action failed: Element not found: .missing');
  });

  it('returns error with stringified message for non-Error throws', async () => {
    executeActionsMock.mockRejectedValueOnce('timeout exceeded');
    const actions = [{ type: 'click' as const, selector: '.btn' }];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    const result = await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Action failed: timeout exceeded');
  });

  it('includes filename in error result', async () => {
    executeActionsMock.mockRejectedValueOnce(new Error('click failed'));
    const actions = [{ type: 'click' as const, selector: '.btn' }];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    const result = await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(result.filename).toBeTruthy();
    expect(result.filename).toContain('test-screenshot');
  });

  it('executes actions BEFORE taking the screenshot', async () => {
    const callOrder: string[] = [];
    executeActionsMock.mockImplementation(async () => {
      callOrder.push('actions');
    });
    const { takeScreenshot } = await import('../screenshot');
    (takeScreenshot as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      callOrder.push('screenshot');
    });

    const actions = [{ type: 'click' as const, selector: '.btn' }];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(callOrder).toEqual(['actions', 'screenshot']);
  });

  it('does not take screenshot when action fails', async () => {
    executeActionsMock.mockRejectedValueOnce(new Error('action error'));
    const { takeScreenshot } = await import('../screenshot');

    const actions = [{ type: 'click' as const, selector: '.btn' }];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(takeScreenshot).not.toHaveBeenCalled();
  });

  it('does not take element screenshot when action fails', async () => {
    executeActionsMock.mockRejectedValueOnce(new Error('action error'));
    const { captureElementWithOptions } = await import('../elementCapture');

    const actions = [{ type: 'click' as const, selector: '.btn' }];
    const screenshot: Screenshot = { ...baseScreenshot, actions, selector: '#hero' };

    await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(captureElementWithOptions).not.toHaveBeenCalled();
  });

  it('passes all action types correctly', async () => {
    const actions = [
      { type: 'click' as const, selector: '.cookie-banner' },
      { type: 'type' as const, selector: '#search', text: 'hello' },
      { type: 'hover' as const, selector: '.menu' },
      { type: 'wait' as const, time: 1 },
      { type: 'press_key' as const, key: 'Escape' },
    ];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(executeActionsMock).toHaveBeenCalledWith(page, actions);
  });

  it('still captures screenshot after successful actions', async () => {
    const { takeScreenshot } = await import('../screenshot');
    const actions = [{ type: 'click' as const, selector: '.btn' }];
    const screenshot: Screenshot = { ...baseScreenshot, actions };

    const result = await captureScreenshot(page as never, screenshot, '/tmp/out', captureOptions);

    expect(result.success).toBe(true);
    expect(takeScreenshot).toHaveBeenCalled();
  });
});
