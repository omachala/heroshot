import { describe, expect, it, vi } from 'vitest';
import type { Screenshot } from '../../types';
import {
  buildCaptureJobs,
  distributeBatches,
  groupJobsByUrl,
  captureParallel,
} from '../parallelCapture';
import type { CaptureJob, ParallelCaptureOptions } from '../parallelCapture';

describe('buildCaptureJobs', () => {
  const baseScreenshot: Screenshot = {
    id: 'test-1',
    name: 'Test Screenshot',
    url: 'https://example.com',
  };

  describe('without viewports', () => {
    it('creates one job per screenshot when no schemes', () => {
      const screenshots: Screenshot[] = [
        { ...baseScreenshot, id: '1', name: 'Screenshot 1' },
        { ...baseScreenshot, id: '2', name: 'Screenshot 2' },
      ];

      const jobs = buildCaptureJobs(screenshots, []);

      expect(jobs).toHaveLength(2);
      expect(jobs[0]).toMatchObject({
        screenshot: screenshots[0],
        colorScheme: undefined,
        hasMultipleSchemes: false,
        hasMultipleViewports: false,
      });
      expect(jobs[1]).toMatchObject({
        screenshot: screenshots[1],
        colorScheme: undefined,
        hasMultipleSchemes: false,
        hasMultipleViewports: false,
      });
    });

    it('creates one job per screenshot-scheme combination with single scheme', () => {
      const screenshots: Screenshot[] = [
        { ...baseScreenshot, id: '1', name: 'Screenshot 1' },
        { ...baseScreenshot, id: '2', name: 'Screenshot 2' },
      ];

      const jobs = buildCaptureJobs(screenshots, ['light']);

      expect(jobs).toHaveLength(2);
      expect(jobs[0]).toMatchObject({
        screenshot: screenshots[0],
        colorScheme: 'light',
        hasMultipleSchemes: false,
      });
      expect(jobs[1]).toMatchObject({
        screenshot: screenshots[1],
        colorScheme: 'light',
        hasMultipleSchemes: false,
      });
    });

    it('creates jobs for each screenshot-scheme combination with multiple schemes', () => {
      const screenshots: Screenshot[] = [
        { ...baseScreenshot, id: '1', name: 'Screenshot 1' },
        { ...baseScreenshot, id: '2', name: 'Screenshot 2' },
      ];

      const jobs = buildCaptureJobs(screenshots, ['light', 'dark']);

      expect(jobs).toHaveLength(4);

      // Screenshot 1 - light
      expect(jobs[0]).toMatchObject({
        screenshot: screenshots[0],
        colorScheme: 'light',
        hasMultipleSchemes: true,
      });
      // Screenshot 1 - dark
      expect(jobs[1]).toMatchObject({
        screenshot: screenshots[0],
        colorScheme: 'dark',
        hasMultipleSchemes: true,
      });
      // Screenshot 2 - light
      expect(jobs[2]).toMatchObject({
        screenshot: screenshots[1],
        colorScheme: 'light',
        hasMultipleSchemes: true,
      });
      // Screenshot 2 - dark
      expect(jobs[3]).toMatchObject({
        screenshot: screenshots[1],
        colorScheme: 'dark',
        hasMultipleSchemes: true,
      });
    });
  });

  describe('with viewports', () => {
    it('creates jobs for each viewport', () => {
      const screenshots: Screenshot[] = [
        {
          ...baseScreenshot,
          id: '1',
          name: 'Screenshot 1',
          viewports: ['desktop', 'mobile'],
        },
      ];

      const jobs = buildCaptureJobs(screenshots, []);

      expect(jobs).toHaveLength(2);
      expect(jobs[0]).toMatchObject({
        screenshot: screenshots[0],
        colorScheme: undefined,
        viewport: { name: 'desktop', width: 1280, height: 800 },
        hasMultipleViewports: true,
      });
      expect(jobs[1]).toMatchObject({
        screenshot: screenshots[0],
        colorScheme: undefined,
        viewport: { name: 'mobile', width: 375, height: 667 },
        hasMultipleViewports: true,
      });
    });

    it('creates jobs for each viewport-scheme combination', () => {
      const screenshots: Screenshot[] = [
        {
          ...baseScreenshot,
          id: '1',
          name: 'Screenshot 1',
          viewports: ['desktop', 'mobile'],
        },
      ];

      const jobs = buildCaptureJobs(screenshots, ['light', 'dark']);

      expect(jobs).toHaveLength(4);

      // Order: screenshot -> scheme -> viewport
      // light-desktop
      expect(jobs[0]).toMatchObject({
        viewport: { name: 'desktop' },
        colorScheme: 'light',
        hasMultipleSchemes: true,
        hasMultipleViewports: true,
      });
      // light-mobile
      expect(jobs[1]).toMatchObject({
        viewport: { name: 'mobile' },
        colorScheme: 'light',
        hasMultipleSchemes: true,
        hasMultipleViewports: true,
      });
      // dark-desktop
      expect(jobs[2]).toMatchObject({
        viewport: { name: 'desktop' },
        colorScheme: 'dark',
        hasMultipleSchemes: true,
        hasMultipleViewports: true,
      });
      // dark-mobile
      expect(jobs[3]).toMatchObject({
        viewport: { name: 'mobile' },
        colorScheme: 'dark',
        hasMultipleSchemes: true,
        hasMultipleViewports: true,
      });
    });

    it('marks single viewport as not multiple', () => {
      const screenshots: Screenshot[] = [
        {
          ...baseScreenshot,
          id: '1',
          name: 'Screenshot 1',
          viewports: ['desktop'],
        },
      ];

      const jobs = buildCaptureJobs(screenshots, []);

      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        hasMultipleViewports: false,
      });
    });

    it('handles custom viewport formats', () => {
      const screenshots: Screenshot[] = [
        {
          ...baseScreenshot,
          id: '1',
          name: 'Screenshot 1',
          viewports: ['800x600'],
        },
      ];

      const jobs = buildCaptureJobs(screenshots, []);

      expect(jobs).toHaveLength(1);
      expect(jobs[0]).toMatchObject({
        viewport: { name: '800x600', width: 800, height: 600 },
      });
    });
  });

  describe('mixed scenarios', () => {
    it('handles screenshots with and without viewports', () => {
      const screenshots: Screenshot[] = [
        { ...baseScreenshot, id: '1', name: 'No viewports' },
        {
          ...baseScreenshot,
          id: '2',
          name: 'With viewports',
          viewports: ['desktop', 'mobile'],
        },
      ];

      const jobs = buildCaptureJobs(screenshots, ['light']);

      expect(jobs).toHaveLength(3);

      // Screenshot 1 - no viewport
      expect(jobs[0]).toMatchObject({
        screenshot: screenshots[0],
        colorScheme: 'light',
        hasMultipleViewports: false,
      });
      expect(jobs[0]?.viewport).toBeUndefined();

      // Screenshot 2 - desktop
      expect(jobs[1]).toMatchObject({
        screenshot: screenshots[1],
        colorScheme: 'light',
        viewport: { name: 'desktop' },
        hasMultipleViewports: true,
      });

      // Screenshot 2 - mobile
      expect(jobs[2]).toMatchObject({
        screenshot: screenshots[1],
        colorScheme: 'light',
        viewport: { name: 'mobile' },
        hasMultipleViewports: true,
      });
    });
  });
});

describe('groupJobsByUrl', () => {
  const createJob = (url: string, id: string): CaptureJob => ({
    screenshot: { id, name: `Screenshot ${id}`, url },
    colorScheme: undefined,
    hasMultipleSchemes: false,
    hasMultipleViewports: false,
  });

  it('groups jobs with same URL together', () => {
    const jobs: CaptureJob[] = [
      createJob('https://example.com/page1', '1'),
      createJob('https://example.com/page2', '2'),
      createJob('https://example.com/page1', '3'),
      createJob('https://example.com/page2', '4'),
    ];

    const groups = groupJobsByUrl(jobs);

    expect(groups.size).toBe(2);
    expect(groups.get('https://example.com/page1')).toHaveLength(2);
    expect(groups.get('https://example.com/page2')).toHaveLength(2);
  });

  it('handles unique URLs', () => {
    const jobs: CaptureJob[] = [
      createJob('https://example.com/page1', '1'),
      createJob('https://example.com/page2', '2'),
      createJob('https://example.com/page3', '3'),
    ];

    const groups = groupJobsByUrl(jobs);

    expect(groups.size).toBe(3);
  });

  it('handles all same URL', () => {
    const jobs: CaptureJob[] = [
      createJob('https://example.com', '1'),
      createJob('https://example.com', '2'),
      createJob('https://example.com', '3'),
    ];

    const groups = groupJobsByUrl(jobs);

    expect(groups.size).toBe(1);
    expect(groups.get('https://example.com')).toHaveLength(3);
  });
});

describe('distributeBatches', () => {
  const createJob = (url: string, id: string): CaptureJob => ({
    screenshot: { id, name: `Screenshot ${id}`, url },
    colorScheme: undefined,
    hasMultipleSchemes: false,
    hasMultipleViewports: false,
  });

  it('keeps same-URL jobs in same batch', () => {
    const urlGroups = new Map<string, CaptureJob[]>([
      [
        'https://example.com/page1',
        [createJob('https://example.com/page1', '1'), createJob('https://example.com/page1', '2')],
      ],
      ['https://example.com/page2', [createJob('https://example.com/page2', '3')]],
    ]);

    const batches = distributeBatches(urlGroups, 2);

    // Each batch should have all jobs from same URL
    for (const batch of batches) {
      const urls = new Set(batch.map(job => job.screenshot.url));
      // All jobs in batch should be from URLs that are fully contained
      for (const url of urls) {
        const urlJobs = batch.filter(j => j.screenshot.url === url);
        const totalForUrl = urlGroups.get(url)?.length ?? 0;
        expect(urlJobs.length).toBe(totalForUrl);
      }
    }
  });

  it('balances batch sizes with greedy algorithm', () => {
    const urlGroups = new Map<string, CaptureJob[]>([
      ['url1', [createJob('url1', '1'), createJob('url1', '2'), createJob('url1', '3')]],
      ['url2', [createJob('url2', '4'), createJob('url2', '5')]],
      ['url3', [createJob('url3', '6')]],
    ]);

    const batches = distributeBatches(urlGroups, 2);

    // Should distribute: batch1 gets url1 (3), batch2 gets url2+url3 (2+1=3)
    expect(batches).toHaveLength(2);
    const sizes = batches.map(b => b.length).sort((a, b) => a - b);
    expect(sizes).toEqual([3, 3]);
  });

  it('handles more workers than URL groups', () => {
    const urlGroups = new Map<string, CaptureJob[]>([
      ['url1', [createJob('url1', '1')]],
      ['url2', [createJob('url2', '2')]],
    ]);

    const batches = distributeBatches(urlGroups, 4);

    // Should only create 2 batches (one per URL group)
    expect(batches).toHaveLength(2);
  });

  it('handles single URL group', () => {
    const urlGroups = new Map<string, CaptureJob[]>([
      ['url1', [createJob('url1', '1'), createJob('url1', '2'), createJob('url1', '3')]],
    ]);

    const batches = distributeBatches(urlGroups, 4);

    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(3);
  });
});

describe('captureParallel error handling', () => {
  it('returns empty results for empty jobs array', async () => {
    // Mock spinner
    const mockSpinner = {
      start: vi.fn(),
      stop: vi.fn(),
      message: vi.fn(),
    };

    const options: ParallelCaptureOptions = {
      jobs: [],
      outputDirectory: '/tmp/test', // NOSONAR - test fixture path, not used in production
      captureOptions: { format: 'png', quality: 80 },
      browserOptions: { viewport: { width: 1280, height: 800 } },
      workers: 2,
      captureSpinner: mockSpinner as ReturnType<typeof import('../../ui').spinner>,
      progress: { captured: 0, total: 0 },
    };

    const results = await captureParallel(options);

    // Empty jobs should return empty results without launching browsers
    expect(results).toEqual([]);
  });

  /**
   * Note: captureParallel uses Promise.allSettled to handle batch failures gracefully.
   * If one worker's browser fails to launch, other workers' results are still collected.
   * This prevents losing all results when a single batch encounters an error.
   *
   * Full integration testing of batch failure recovery requires browser mocking,
   * which is complex. The Promise.allSettled pattern is verified by code review.
   */
});
