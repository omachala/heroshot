import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dispatchHighlightJob,
  initHeroshot,
  isHeroshotInitialized,
  updatePendingJob,
} from '../pageScripts';

describe('pageScripts', () => {
  /**
   * These functions are serialized and run in browser context via page.evaluate().
   * They must NOT reference module-level variables, as those won't be available
   * when the function is serialized and executed in a different context.
   *
   * This test verifies the functions can be serialized and evaluated without
   * ReferenceErrors from missing module-level variables.
   */
  describe('serialization safety', () => {
    it('isHeroshotInitialized does not reference module-level variables', () => {
      // Serialize and re-evaluate the function in an isolated context
      const fnString = isHeroshotInitialized.toString();
      // Should not contain references to 'browser' variable (the old bug)
      expect(fnString).not.toMatch(/\bbrowser\./);
      // Should use globalThis directly
      expect(fnString).toContain('globalThis');
    });

    it('initHeroshot does not reference module-level variables', () => {
      const fnString = initHeroshot.toString();
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

  describe('initHeroshot', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test setup
      (globalThis as any).__heroshotEmit = vi.fn();
    });

    it('creates __heroshot global with provided options', () => {
      const options = {
        screenshots: [
          { id: '1', name: 'Test', url: 'https://example.com', selector: '', createdAt: 0 },
        ],
        pendingJob: null,
        selectedId: 'selected-1',
        sidebarExpanded: true,
      };

      initHeroshot(options);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test assertion
      const heroshot = (globalThis as any).__heroshot;
      expect(heroshot).toBeDefined();
      expect(heroshot.initialized).toBe(false);
      expect(heroshot.screenshots).toEqual(options.screenshots);
      expect(heroshot.pendingJob).toBeNull();
      expect(heroshot.selectedId).toBe('selected-1');
      expect(heroshot.sidebarExpanded).toBe(true);
    });

    it('creates emit function that calls __heroshotEmit with JSON', () => {
      initHeroshot({
        screenshots: [],
        pendingJob: null,
        selectedId: null,
        sidebarExpanded: false,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- test
      (globalThis as any).__heroshot.emit({ type: 'done' });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- test assertion
      expect((globalThis as any).__heroshotEmit).toHaveBeenCalledWith('{"type":"done"}');
    });
  });

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
