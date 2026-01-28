import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatchHighlightJob, isHeroshotInitialized, updatePendingJob } from '../pageScripts';

describe('pageScripts', () => {
  /**
   * These functions are serialized and run in browser context via page.evaluate().
   * They must NOT reference module-level variables, as those won't be available
   * when the function is serialized and executed in a different context.
   *
   * IMPORTANT: Only functions WITHOUT nested function properties can be exported
   * from pageScripts.ts. Functions with nested function properties (like initHeroshot)
   * would get esbuild's __name wrapper which breaks page.evaluate serialization.
   * See pageScripts.ts header comment for full explanation.
   */
  describe('serialization safety', () => {
    it('isHeroshotInitialized does not reference module-level variables', () => {
      const fnString = isHeroshotInitialized.toString();
      expect(fnString).not.toMatch(/\bbrowser\./);
      expect(fnString).toContain('globalThis');
    });

    it('updatePendingJob does not reference module-level variables', () => {
      const fnString = updatePendingJob.toString();
      expect(fnString).not.toMatch(/\bbrowser\./);
      expect(fnString).toContain('globalThis');
    });

    it('dispatchHighlightJob does not reference module-level variables', () => {
      const fnString = dispatchHighlightJob.toString();
      expect(fnString).not.toMatch(/\bbrowser\./);
      expect(fnString).toContain('globalThis');
    });

    it('functions do not contain esbuild __name helper', () => {
      // These functions should NOT have nested function properties,
      // so esbuild won't add __name wrappers
      expect(isHeroshotInitialized.toString()).not.toContain('__name');
      expect(updatePendingJob.toString()).not.toContain('__name');
      expect(dispatchHighlightJob.toString()).not.toContain('__name');
    });
  });

  beforeEach(() => {
    // Reset globalThis state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test cleanup
    delete (globalThis as any).__heroshot;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test cleanup
    delete (globalThis as any).__heroshotEmit;
  });

  describe('isHeroshotInitialized', () => {
    it('returns false when __heroshot is undefined', () => {
      expect(isHeroshotInitialized()).toBe(false);
    });

    it('returns false when initialized is false', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test setup
      (globalThis as any).__heroshot = { initialized: false };
      expect(isHeroshotInitialized()).toBe(false);
    });

    it('returns true when initialized is true', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test setup
      (globalThis as any).__heroshot = { initialized: true };
      expect(isHeroshotInitialized()).toBe(true);
    });
  });

  // NOTE: initHeroshot is NOT tested here because it cannot be exported as a
  // typed function - it contains a nested function property (emit) which would
  // get esbuild's __name wrapper. It's implemented via string evaluation in
  // injectToolbar.ts. The integration is tested via e2e tests.

  describe('updatePendingJob', () => {
    let dispatchEventMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test setup
      (globalThis as any).__heroshot = { pendingJob: null };
      // Mock dispatchEvent since it doesn't exist in Node.js
      dispatchEventMock = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test setup
      (globalThis as any).dispatchEvent = dispatchEventMock;
    });

    it('updates pendingJob on __heroshot', () => {
      const job = { type: 'highlight' as const, selector: '.test' };
      updatePendingJob(job);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test assertion
      expect((globalThis as any).__heroshot.pendingJob).toEqual(job);
    });

    it('dispatches heroshot-job event', () => {
      const job = { type: 'highlight' as const, selector: '.test' };
      updatePendingJob(job);

      expect(dispatchEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'heroshot-job',
          detail: job,
        })
      );
    });
  });

  describe('dispatchHighlightJob', () => {
    let dispatchEventMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock dispatchEvent since it doesn't exist in Node.js
      dispatchEventMock = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test setup
      (globalThis as any).dispatchEvent = dispatchEventMock;
    });

    it('dispatches heroshot-job event with highlight details', () => {
      dispatchHighlightJob({ selector: '.hero', screenshotId: 'test-123' });

      expect(dispatchEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'heroshot-job',
          detail: {
            type: 'highlight',
            selector: '.hero',
            screenshotId: 'test-123',
          },
        })
      );
    });
  });
});
