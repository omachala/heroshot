import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Heroshot from '../components/Heroshot.vue';
import type { Manifest } from '../../../shared';

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

  describe('srcset generation', () => {
    it('generates srcset for viewport variants', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Homepage Hero', manifest: testManifest },
      });
      const srcset = wrapper.find('img').attributes('srcset');
      expect(srcset).toContain('heroshots/homepage-hero-mobile-light.png');
      expect(srcset).toContain('heroshots/homepage-hero-desktop-light.png');
    });

    it('does not generate srcset when no viewports', () => {
      const wrapper = mount(Heroshot, {
        props: { name: 'Dashboard', manifest: testManifest },
      });
      expect(wrapper.find('img').attributes('srcset')).toBeUndefined();
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
});
