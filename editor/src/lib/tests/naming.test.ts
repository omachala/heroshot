/**
 * Unit tests for naming.ts
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { extractSelectorName, generateSmartName, generateUid } from '../naming';

describe('extractSelectorName', () => {
  describe('ID selectors', () => {
    it('extracts simple ID', () => {
      expect(extractSelectorName('#hero')).toBe('hero');
    });

    it('extracts ID with hyphens and converts to spaces', () => {
      expect(extractSelectorName('#contact-form')).toBe('contact form');
    });

    it('extracts ID with underscores and converts to spaces', () => {
      expect(extractSelectorName('#user_profile')).toBe('user profile');
    });

    it('extracts ID from complex selector', () => {
      expect(extractSelectorName('div#main-content')).toBe('main content');
    });
  });

  describe('class selectors', () => {
    it('extracts simple class', () => {
      expect(extractSelectorName('.card')).toBe('card');
    });

    it('extracts class with hyphens and converts to spaces', () => {
      expect(extractSelectorName('.hero-section')).toBe('hero section');
    });

    it('extracts class with underscores and converts to spaces', () => {
      expect(extractSelectorName('.nav_item')).toBe('nav item');
    });

    it('extracts first class from multiple classes', () => {
      expect(extractSelectorName('.btn.btn-primary')).toBe('btn');
    });

    it('extracts class with nth-of-type', () => {
      expect(extractSelectorName('.card:nth-of-type(3)')).toBe('card 3');
    });

    it('extracts class with nth-of-type from complex selector', () => {
      expect(extractSelectorName('div.item:nth-of-type(5)')).toBe('item 5');
    });
  });

  describe('tag selectors', () => {
    it('extracts tag name', () => {
      expect(extractSelectorName('button')).toBe('button');
    });

    it('extracts tag with nth-of-type', () => {
      expect(extractSelectorName('li:nth-of-type(2)')).toBe('li 2');
    });

    it('extracts tag from complex selector without class or ID', () => {
      expect(extractSelectorName('div:nth-of-type(1)')).toBe('div 1');
    });
  });

  describe('shadow DOM selectors (>>>)', () => {
    it('extracts from last part after >>>', () => {
      expect(extractSelectorName('host-element >>> .inner-class')).toBe('inner class');
    });

    it('extracts from deeply nested shadow selector', () => {
      expect(extractSelectorName('host >>> inner >>> #deep-element')).toBe('deep element');
    });

    it('handles >>> with spaces', () => {
      expect(extractSelectorName('host >>> .target')).toBe('target');
    });
  });

  describe('child combinator selectors (>)', () => {
    it('extracts from last part after >', () => {
      expect(extractSelectorName('div > .child-class')).toBe('child class');
    });

    it('extracts from nested child selector', () => {
      expect(extractSelectorName('ul > li > .item-name')).toBe('item name');
    });
  });

  describe('fallback', () => {
    it('returns "element" for unrecognized selector', () => {
      expect(extractSelectorName('')).toBe('element');
    });

    it('returns "element" for selector with only symbols', () => {
      expect(extractSelectorName('*')).toBe('element');
    });
  });
});

describe('generateSmartName', () => {
  const originalTitle = document.title;

  beforeEach(() => {
    document.title = 'Test Page';
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it('combines page title with selector name', () => {
    expect(generateSmartName('#hero')).toBe('Test Page - hero');
  });

  it('handles class selector', () => {
    expect(generateSmartName('.contact-form')).toBe('Test Page - contact form');
  });

  it('truncates long page titles to 30 characters', () => {
    document.title = 'This is a very long page title that should be truncated';
    const result = generateSmartName('#hero');
    expect(result).toBe('This is a very long page title - hero');
  });

  it('uses "Page" when document.title is empty', () => {
    document.title = '';
    expect(generateSmartName('#hero')).toBe('Page - hero');
  });

  it('handles complex selectors', () => {
    expect(generateSmartName('div.card:nth-of-type(3)')).toBe('Test Page - card 3');
  });
});

describe('generateUid', () => {
  it('returns a string', () => {
    expect(typeof generateUid()).toBe('string');
  });

  it('returns 8 characters', () => {
    expect(generateUid().length).toBe(8);
  });

  it('returns alphanumeric characters', () => {
    const uid = generateUid();
    expect(uid).toMatch(/^[a-z0-9]+$/);
  });

  it('generates unique values', () => {
    const uids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uids.add(generateUid());
    }
    // Should have 100 unique UIDs (statistically very likely)
    expect(uids.size).toBe(100);
  });
});
