import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Heroshot from '../components/Heroshot.vue';
import type { Manifest } from '../../../shared';

// Helper to wait for MutationObserver callbacks
const flushMutationObserver = () => new Promise(resolve => setTimeout(resolve, 0));

// Sample manifest for testing
const testManifest: Manifest = {
  version: 1,
  outputDirectory: 'heroshots',
  screenshots: {
    Dashboard: {
      slug: 'dashboard',
      viewports: [],
      colorSchemes: ['light', 'dark'],
      format: 'png',
    },
    'Homepage Hero': {
      slug: 'homepage-hero',
      viewports: ['mobile', 'desktop'],
      colorSchemes: ['light', 'dark'],
      format: 'png',
    },
    Simple: {
      slug: 'simple',
      viewports: [],
      colorSchemes: [],
      format: 'png',
    },
  },
};

describe('Heroshot', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    delete document.documentElement.dataset.theme;
  });

  describe('manifest lookup', () => {
    it('finds screenshot by name', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest },
      });
      expect(wrapper.find('img').exists()).toBe(true);
    });

    it('shows warning for missing screenshot', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Nonexistent', manifest: testManifest },
      });
      expect(wrapper.find('span').text()).toContain('not found');
    });
  });

  describe('path generation', () => {
    it('generates light mode path in light mode', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest },
      });
      expect(wrapper.find('img').attributes('src')).toBe('heroshots/dashboard-light.png');
    });

    it('generates dark mode path when dark class is set', async () => {
      document.documentElement.classList.add('dark');
      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('img').attributes('src')).toBe('heroshots/dashboard-dark.png');
    });

    it('generates path without color scheme suffix when no schemes', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Simple', manifest: testManifest },
      });
      expect(wrapper.find('img').attributes('src')).toBe('heroshots/simple.png');
    });
  });

  describe('viewport source generation', () => {
    it('generates picture sources for viewport variants', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Homepage Hero', manifest: testManifest },
      });
      const sources = wrapper.findAll('source').map(s => s.attributes('srcset'));
      expect(sources).toContain('heroshots/homepage-hero-mobile-light.png');
      expect(sources).toContain('heroshots/homepage-hero-desktop-light.png');
    });

    it('uses img without picture when no viewports', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest },
      });
      expect(wrapper.find('picture').exists()).toBe(false);
      expect(wrapper.find('img').exists()).toBe(true);
    });
  });

  describe('attributes', () => {
    it('sets alt attribute', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest, alt: 'Dashboard screenshot' },
      });
      expect(wrapper.find('img').attributes('alt')).toBe('Dashboard screenshot');
    });

    it('sets loading=lazy', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest },
      });
      expect(wrapper.find('img').attributes('loading')).toBe('lazy');
    });
  });

  describe('dark mode detection', () => {
    it('uses light mode when no dark class even if OS prefers dark (regression test)', () => {
      // This test ensures that we don't fall back to prefers-color-scheme
      // when the framework's theme toggle (class-based) says light mode.
      // Bug: On mobile with dark OS preference but site in light mode,
      // the component was incorrectly showing dark screenshots.
      document.documentElement.classList.remove('dark');

      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest },
      });

      // Should show light mode path regardless of OS prefers-color-scheme
      expect(wrapper.find('img').attributes('src')).toBe('heroshots/dashboard-light.png');
    });

    it('uses dark mode only when dark class is explicitly set', async () => {
      // Start in light mode
      document.documentElement.classList.remove('dark');
      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest },
      });
      expect(wrapper.find('img').attributes('src')).toBe('heroshots/dashboard-light.png');

      // Toggle to dark mode via class (like VitePress does)
      document.documentElement.classList.add('dark');
      await flushMutationObserver();
      await flushPromises();
      expect(wrapper.find('img').attributes('src')).toBe('heroshots/dashboard-dark.png');

      // Toggle back to light mode
      document.documentElement.classList.remove('dark');
      await flushMutationObserver();
      await flushPromises();
      expect(wrapper.find('img').attributes('src')).toBe('heroshots/dashboard-light.png');
    });

    it('updates viewport sources when theme changes (regression test)', async () => {
      document.documentElement.classList.remove('dark');
      const wrapper = mount(Heroshot, {
        props: { name: 'Homepage Hero', manifest: testManifest },
      });

      // In light mode, sources should be light
      const lightSources = wrapper.findAll('source').map(s => s.attributes('srcset'));
      expect(lightSources.every(src => src?.includes('-light.png'))).toBe(true);

      // Toggle to dark mode
      document.documentElement.classList.add('dark');
      await flushMutationObserver();
      await flushPromises();

      // Sources should now be dark
      const darkSources = wrapper.findAll('source').map(s => s.attributes('srcset'));
      expect(darkSources.every(src => src?.includes('-dark.png'))).toBe(true);
    });
  });
});
