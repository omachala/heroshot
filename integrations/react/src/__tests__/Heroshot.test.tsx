import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heroshot } from '../components/Heroshot';
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
      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('shows warning for missing screenshot', () => {
      render(<Heroshot name="Nonexistent" manifest={testManifest} />);
      expect(screen.getByText(/not found/)).toBeInTheDocument();
    });
  });

  describe('path generation', () => {
    it('generates light mode path in light mode', () => {
      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);
      expect(screen.getByRole('img').getAttribute('src')).toBe('heroshots/dashboard-light.png');
    });

    it('generates dark mode path when dark class is set', () => {
      document.documentElement.classList.add('dark');
      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);
      expect(screen.getByRole('img').getAttribute('src')).toBe('heroshots/dashboard-dark.png');
    });

    it('generates path without color scheme suffix when no schemes', () => {
      render(<Heroshot name="Simple" manifest={testManifest} alt="test" />);
      expect(screen.getByRole('img').getAttribute('src')).toBe('heroshots/simple.png');
    });
  });

  describe('viewport source generation', () => {
    it('generates picture sources for viewport variants', () => {
      const { container } = render(
        <Heroshot name="Homepage Hero" manifest={testManifest} alt="test" />
      );
      const sources = container.querySelectorAll('source');
      const srcsets = Array.from(sources).map(s => s.getAttribute('srcset'));
      expect(srcsets).toContain('heroshots/homepage-hero-mobile-light.png');
      expect(srcsets).toContain('heroshots/homepage-hero-desktop-light.png');
    });

    it('uses img without picture when no viewports', () => {
      const { container } = render(
        <Heroshot name="Dashboard" manifest={testManifest} alt="test" />
      );
      expect(container.querySelector('picture')).toBeNull();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('attributes', () => {
    it('sets alt attribute', () => {
      render(<Heroshot name="Dashboard" manifest={testManifest} alt="Dashboard screenshot" />);
      expect(screen.getByAltText('Dashboard screenshot')).toBeInTheDocument();
    });

    it('sets loading=lazy', () => {
      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);
      expect(screen.getByRole('img').getAttribute('loading')).toBe('lazy');
    });
  });

  describe('dark mode detection', () => {
    it('uses light mode when no dark class even if OS prefers dark (regression test)', () => {
      // This test ensures that we don't fall back to prefers-color-scheme
      // when the framework's theme toggle (class-based) says light mode.
      // Bug: On mobile with dark OS preference but site in light mode,
      // the component was incorrectly showing dark screenshots.
      document.documentElement.classList.remove('dark');

      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);

      // Should show light mode path regardless of OS prefers-color-scheme
      expect(screen.getByRole('img').getAttribute('src')).toBe('heroshots/dashboard-light.png');
    });

    it('uses dark mode when data-theme is set to dark (Docusaurus)', () => {
      document.documentElement.dataset.theme = 'dark';

      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);

      expect(screen.getByRole('img').getAttribute('src')).toBe('heroshots/dashboard-dark.png');
    });

    it('uses light mode when data-theme is set to light (Docusaurus)', () => {
      document.documentElement.dataset.theme = 'light';

      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);

      expect(screen.getByRole('img').getAttribute('src')).toBe('heroshots/dashboard-light.png');
    });

    it('prefers data-theme over class for dark mode detection', () => {
      // data-theme should take priority (Docusaurus compatibility)
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'light';

      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);

      expect(screen.getByRole('img').getAttribute('src')).toBe('heroshots/dashboard-light.png');
    });
  });
});
