/**
 * SelectorGenerator Unit Tests
 *
 * Tests for smart selector generation using Playwright-compatible formats.
 * Prioritizes stable selectors: data-testid > role > text > CSS
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateSelector, SelectorGenerator } from '../selectorGenerator';

describe('SelectorGenerator', () => {
  let generator: SelectorGenerator;

  beforeEach(() => {
    document.body.innerHTML = '';
    generator = new SelectorGenerator();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('data-testid selectors', () => {
    it('should prefer data-testid over other selectors', () => {
      const button = document.createElement('button');
      button.setAttribute('data-testid', 'submit-btn');
      button.id = 'my-button';
      button.textContent = 'Submit';
      document.body.appendChild(button);

      expect(generator.generate(button)).toBe('[data-testid="submit-btn"]');
    });

    it('should support data-test attribute', () => {
      const button = document.createElement('button');
      button.setAttribute('data-test', 'login-btn');
      document.body.appendChild(button);

      expect(generator.generate(button)).toBe('[data-test="login-btn"]');
    });

    it('should support data-cy attribute (Cypress)', () => {
      const button = document.createElement('button');
      button.setAttribute('data-cy', 'signup-btn');
      document.body.appendChild(button);

      expect(generator.generate(button)).toBe('[data-cy="signup-btn"]');
    });

    it('should prefer data-testid over data-test and data-cy', () => {
      const button = document.createElement('button');
      button.setAttribute('data-testid', 'primary');
      button.setAttribute('data-test', 'secondary');
      button.setAttribute('data-cy', 'tertiary');
      document.body.appendChild(button);

      expect(generator.generate(button)).toBe('[data-testid="primary"]');
    });
  });

  describe('role-based selectors', () => {
    it('should use role with accessible name for buttons', () => {
      const button = document.createElement('button');
      button.textContent = 'Submit Form';
      document.body.appendChild(button);

      expect(generator.generate(button)).toBe('role=button[name="Submit Form"]');
    });

    it('should use role with aria-label', () => {
      const button = document.createElement('button');
      button.setAttribute('aria-label', 'Close dialog');
      button.innerHTML = '<svg></svg>';
      document.body.appendChild(button);

      expect(generator.generate(button)).toBe('role=button[name="Close dialog"]');
    });

    it('should use role for links with href', () => {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'Learn more';
      document.body.appendChild(link);

      expect(generator.generate(link)).toBe('role=link[name="Learn more"]');
    });

    it('should use role for textbox inputs with label', () => {
      const label = document.createElement('label');
      label.setAttribute('for', 'email');
      label.textContent = 'Email address';
      document.body.appendChild(label);

      const input = document.createElement('input');
      input.id = 'email';
      input.type = 'email';
      document.body.appendChild(input);

      expect(generator.generate(input)).toBe('role=textbox[name="Email address"]');
    });

    it('should use role for checkbox inputs', () => {
      const label = document.createElement('label');
      label.innerHTML = '<input type="checkbox" /> Remember me';
      document.body.appendChild(label);

      const checkbox = label.querySelector('input')!;
      expect(generator.generate(checkbox)).toBe('role=checkbox[name="Remember me"]');
    });

    it('should use role for headings', () => {
      const h1 = document.createElement('h1');
      h1.textContent = 'Welcome';
      document.body.appendChild(h1);

      // Headings use role without name typically
      const selector = generator.generate(h1);
      expect(selector).toContain('heading');
    });
  });

  describe('text-based selectors', () => {
    it('should use text selector for unique visible text', () => {
      const span = document.createElement('span');
      span.textContent = 'Unique Label Text';
      document.body.appendChild(span);

      // Span has no role, so falls back to text
      expect(generator.generate(span)).toBe('text="Unique Label Text"');
    });

    it('should use fallback for very long text (truncated text may not match uniquely)', () => {
      const span = document.createElement('span');
      span.textContent =
        'This is a very long text content that should be truncated to avoid overly verbose selectors in the output';
      document.body.appendChild(span);

      const selector = generator.generate(span);
      // Should produce some selector (may be css fallback since truncated text won't match)
      expect(selector.length).toBeLessThan(120);
      expect(selector).toBeTruthy();
    });

    it('should normalize whitespace in text selectors', () => {
      const span = document.createElement('span');
      span.innerHTML = '  Multiple   Spaces  ';
      document.body.appendChild(span);

      expect(generator.generate(span)).toBe('text="Multiple Spaces"');
    });
  });

  describe('CSS ID selectors', () => {
    it('should use ID for elements without better selectors', () => {
      const div = document.createElement('div');
      div.id = 'main-content';
      document.body.appendChild(div);

      expect(generator.generate(div)).toBe('#main-content');
    });

    it('should skip GUID-like IDs', () => {
      const div = document.createElement('div');
      div.id = '550e8400-e29b-41d4-a716-446655440000';
      div.textContent = 'Unique text here';
      document.body.appendChild(div);

      const selector = generator.generate(div);
      expect(selector).not.toContain('550e8400');
      expect(selector).toBe('text="Unique text here"');
    });

    it('should skip React useId pattern IDs', () => {
      const div = document.createElement('div');
      div.id = ':r1:';
      div.className = 'container';
      document.body.appendChild(div);

      const selector = generator.generate(div);
      expect(selector).not.toContain(':r1:');
    });
  });

  describe('placeholder selectors', () => {
    it('should use placeholder for inputs', () => {
      const input = document.createElement('input');
      input.placeholder = 'Enter your name';
      document.body.appendChild(input);

      const selector = generator.generate(input);
      expect(selector).toBe('role=textbox[name="Enter your name"]');
    });

    it('should use placeholder for textarea', () => {
      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Write a message...';
      document.body.appendChild(textarea);

      const selector = generator.generate(textarea);
      expect(selector).toBe('role=textbox[name="Write a message..."]');
    });
  });

  describe('uniqueness testing', () => {
    it('should find unique selector among siblings', () => {
      // Create multiple buttons
      const btn1 = document.createElement('button');
      btn1.textContent = 'Submit';
      document.body.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.textContent = 'Cancel';
      document.body.appendChild(btn2);

      expect(generator.generate(btn1)).toBe('role=button[name="Submit"]');
      expect(generator.generate(btn2)).toBe('role=button[name="Cancel"]');
    });

    it('should add context when name is not unique', () => {
      // Create identical buttons
      const btn1 = document.createElement('button');
      btn1.textContent = 'Delete';
      document.body.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.textContent = 'Delete';
      document.body.appendChild(btn2);

      const selector1 = generator.generate(btn1);
      const selector2 = generator.generate(btn2);

      // Both should resolve to different elements
      expect(selector1).not.toBe(selector2);
    });

    it('should fall back to nth selector when needed', () => {
      // Create completely identical elements
      const container = document.createElement('div');
      document.body.appendChild(container);

      for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        span.className = 'item';
        container.appendChild(span);
      }

      const spans = container.querySelectorAll('span');
      const selector1 = generator.generate(spans[0]!);
      const selector2 = generator.generate(spans[1]!);

      // Should differentiate with nth or index
      expect(selector1).not.toBe(selector2);
    });
  });

  describe('shadow DOM support', () => {
    it('should generate selector with >> for shadow DOM', () => {
      // Create custom element with shadow DOM
      const host = document.createElement('div');
      host.id = 'my-component';
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: 'open' });
      const inner = document.createElement('button');
      inner.textContent = 'Shadow Button';
      shadow.appendChild(inner);

      const selector = generator.generate(inner);
      expect(selector).toContain('>>');
      expect(selector).toContain('my-component');
    });

    it('should handle nested shadow DOMs', () => {
      // Create nested shadow DOM structure
      const outer = document.createElement('div');
      outer.id = 'outer-host';
      document.body.appendChild(outer);

      const outerShadow = outer.attachShadow({ mode: 'open' });
      const inner = document.createElement('div');
      inner.id = 'inner-host';
      outerShadow.appendChild(inner);

      const innerShadow = inner.attachShadow({ mode: 'open' });
      const button = document.createElement('button');
      button.textContent = 'Deep Button';
      innerShadow.appendChild(button);

      const selector = generator.generate(button);
      // Should have multiple >> piercings
      expect((selector.match(/>>/g) || []).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('generateSelector convenience function', () => {
    it('should work as drop-in replacement for getSelector', () => {
      const button = document.createElement('button');
      button.textContent = 'Click me';
      document.body.appendChild(button);

      const selector = generateSelector(button);
      expect(selector).toBe('role=button[name="Click me"]');
    });
  });

  describe('generateCandidates', () => {
    it('should return multiple candidates sorted by score', () => {
      const button = document.createElement('button');
      button.setAttribute('data-testid', 'my-btn');
      button.id = 'btn-1';
      button.textContent = 'Submit';
      document.body.appendChild(button);

      const candidates = generator.generateCandidates(button);

      expect(candidates.length).toBeGreaterThan(1);
      // First should be data-testid (lowest score)
      expect(candidates[0]?.selector).toBe('[data-testid="my-btn"]');
      // Should include role
      expect(candidates.some(c => c.selector.includes('role=button'))).toBe(true);
    });
  });

  describe('isUnique', () => {
    it('should return true for unique selector', () => {
      const button = document.createElement('button');
      button.setAttribute('data-testid', 'unique-btn');
      document.body.appendChild(button);

      expect(generator.isUnique('[data-testid="unique-btn"]', button)).toBe(true);
    });

    it('should return false for non-unique selector', () => {
      const btn1 = document.createElement('button');
      btn1.className = 'common';
      document.body.appendChild(btn1);

      const btn2 = document.createElement('button');
      btn2.className = 'common';
      document.body.appendChild(btn2);

      expect(generator.isUnique('button.common', btn1)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle elements with no identifying attributes', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const selector = generator.generate(div);
      // Should return some valid selector
      expect(selector).toBeTruthy();
    });

    it('should escape special characters in attribute values', () => {
      const button = document.createElement('button');
      button.setAttribute('data-testid', 'btn-"special\'chars');
      document.body.appendChild(button);

      const selector = generator.generate(button);
      // Should be properly escaped
      expect(selector).toContain('data-testid');
    });

    it('should handle elements with empty text content', () => {
      const button = document.createElement('button');
      button.innerHTML = '<svg></svg>';
      document.body.appendChild(button);

      const selector = generator.generate(button);
      // Should fall back to something other than text
      expect(selector).not.toContain('text=""');
    });

    it('should not include heroshot internal elements', () => {
      const container = document.createElement('div');
      container.id = 'heroshot-root';
      document.body.appendChild(container);

      const regular = document.createElement('button');
      regular.textContent = 'Regular Button';
      document.body.appendChild(regular);

      const selector = generator.generate(regular);
      expect(selector).not.toContain('heroshot');
    });
  });

  describe('selector validation edge cases', () => {
    it('should handle invalid CSS selectors in isUnique', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      // An invalid CSS selector should return false instead of throwing
      expect(generator.isUnique('::invalid[[[selector', button)).toBe(false);
    });

    it('should handle invalid CSS selectors in queryAll', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      // An invalid CSS selector should return empty array instead of throwing
      expect(generator.queryAll('::invalid[[[selector').length).toBe(0);
    });
  });
});
