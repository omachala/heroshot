import { describe, expect, it } from 'vitest';
import type { Screenshot } from '../../types';
import { buildCaptureJobs } from '../parallelCapture';

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
