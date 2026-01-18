import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Heroshot } from '../components/Heroshot';
import type { Manifest } from '../../../shared';

// Sample manifest for testing
const testManifest: Manifest = {
  version: 1,
  outputDirectory: 'heroshots',
  byName: {
    Dashboard: {
      id: 'dash-1',
      slug: 'dashboard',
      viewports: [],
      colorSchemes: ['light', 'dark'],
      format: 'png',
    },
    'Homepage Hero': {
      id: 'hero-1',
      slug: 'homepage-hero',
      viewports: ['mobile', 'desktop'],
      colorSchemes: ['light', 'dark'],
      format: 'png',
    },
    Simple: {
      id: 'simple-1',
      slug: 'simple',
      viewports: [],
      colorSchemes: [],
      format: 'png',
    },
  },
  byId: {
    'dash-1': {
      id: 'dash-1',
      slug: 'dashboard',
      viewports: [],
      colorSchemes: ['light', 'dark'],
      format: 'png',
    },
    'hero-1': {
      id: 'hero-1',
      slug: 'homepage-hero',
      viewports: ['mobile', 'desktop'],
      colorSchemes: ['light', 'dark'],
      format: 'png',
    },
    'simple-1': {
      id: 'simple-1',
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
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  describe('manifest lookup', () => {
    it('finds screenshot by name', () => {
      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('finds screenshot by id', () => {
      render(<Heroshot id="dash-1" manifest={testManifest} alt="test" />);
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

  describe('srcset generation', () => {
    it('generates srcset for viewport variants', () => {
      render(<Heroshot name="Homepage Hero" manifest={testManifest} alt="test" />);
      const srcset = screen.getByRole('img').getAttribute('srcset');
      expect(srcset).toContain('heroshots/homepage-hero-mobile-light.png');
      expect(srcset).toContain('heroshots/homepage-hero-desktop-light.png');
    });

    it('does not generate srcset when no viewports', () => {
      render(<Heroshot name="Dashboard" manifest={testManifest} alt="test" />);
      expect(screen.getByRole('img').getAttribute('srcset')).toBeNull();
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
});
