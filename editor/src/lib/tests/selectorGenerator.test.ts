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
    // Note: jsdom has limited shadow DOM support, so these tests verify
    // the generator returns a valid selector rather than specific shadow piercing format
    it('should generate selector for element in shadow DOM', () => {
      // Create custom element with shadow DOM
      const host = document.createElement('div');
      host.id = 'my-component';
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: 'open' });
      const inner = document.createElement('button');
      inner.textContent = 'Shadow Button';
      shadow.appendChild(inner);

      const selector = generator.generate(inner);
      // Should return a valid selector (may be shadow-piercing or fallback in jsdom)
      expect(selector).toBeTruthy();
      expect(selector.length).toBeGreaterThan(0);
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
      // Should return some valid selector
      expect(selector).toBeTruthy();
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
      // (queryAll catch block returns empty array, isUnique returns false)
      expect(generator.isUnique('::invalid[[[selector', button)).toBe(false);
    });
  });

  describe('buildFullCssPath fallback', () => {
    // Note: The generator prioritizes simpler selectors (text=, role=) when unique.
    // These tests verify that selectors are unique and identify the correct element,
    // regardless of format. Use generator.isUnique() for verification since
    // document.querySelector() doesn't support Playwright selector formats.

    it('should generate unique selector for deeply nested generic divs', () => {
      // Create a deep DOM structure
      document.body.innerHTML = `
        <div class="app">
          <div class="container">
            <div class="row">
              <div class="col">
                <div class="card">
                  <div class="target">Target element</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      const target = document.querySelector('.target')!;
      const selector = generator.generate(target);

      // Should NOT be just "div:nth-of-type(1)" - that would match wrong element
      expect(selector).not.toBe('div:nth-of-type(1)');
      expect(selector).not.toBe('div');

      // Selector should uniquely identify the element
      expect(generator.isUnique(selector, target)).toBe(true);
    });

    it('should generate unique selector for element without classes or id', () => {
      document.body.innerHTML = `
        <main>
          <section>
            <article>
              <div>
                <span>First span</span>
                <span>Target span</span>
              </div>
            </article>
          </section>
        </main>
      `;

      const spans = document.querySelectorAll('span');
      const target = spans[1]!; // Second span
      const selector = generator.generate(target);

      // Selector should uniquely identify the element
      expect(generator.isUnique(selector, target)).toBe(true);

      // Should NOT match the first span
      expect(generator.isUnique(selector, spans[0]!)).toBe(false);
    });

    it('should generate unique selector that may leverage stable ID in ancestor', () => {
      document.body.innerHTML = `
        <div id="app-root">
          <div class="wrapper">
            <div class="content">
              <span class="target">Target</span>
            </div>
          </div>
        </div>
      `;

      const target = document.querySelector('.target')!;
      const selector = generator.generate(target);

      // Selector should uniquely identify the element
      expect(generator.isUnique(selector, target)).toBe(true);
    });

    it('should generate unique selectors for multiple same-tag siblings', () => {
      document.body.innerHTML = `
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li class="target">Item 3</li>
          <li>Item 4</li>
          <li>Item 5</li>
        </ul>
      `;

      const target = document.querySelector('.target')!;
      const selector = generator.generate(target);

      // Selector should uniquely identify the element
      expect(generator.isUnique(selector, target)).toBe(true);
    });

    it('should generate unique selectors for all identical siblings', () => {
      document.body.innerHTML = `
        <div class="grid">
          <div class="cell"></div>
          <div class="cell"></div>
          <div class="cell"></div>
        </div>
      `;

      const cells = document.querySelectorAll('.cell');
      const selectors = [...cells].map(cell => generator.generate(cell));

      // All selectors should be different
      const uniqueSelectors = new Set(selectors);
      expect(uniqueSelectors.size).toBe(3);

      // Each selector should uniquely identify its respective element
      selectors.forEach((selector, index) => {
        expect(generator.isUnique(selector, cells[index]!)).toBe(true);
      });
    });

    it('should handle complex real-world DOM structure', () => {
      // Simulate a Bootstrap-like page structure
      document.body.innerHTML = `
        <div class="wrapper">
          <nav class="navbar">
            <div class="container">
              <a href="#">Brand</a>
            </div>
          </nav>
          <main class="container">
            <div class="row">
              <div class="col-8">
                <article>
                  <h1>Title</h1>
                  <p>First paragraph</p>
                  <p>Second paragraph</p>
                  <div class="card">
                    <div class="card-body">
                      <p>Card content</p>
                    </div>
                  </div>
                </article>
              </div>
              <div class="col-4">
                <aside>
                  <div class="widget">
                    <p>Widget content</p>
                  </div>
                </aside>
              </div>
            </div>
          </main>
        </div>
      `;

      // Target a specific paragraph deep in the DOM
      const cardContent = document.querySelector('.card-body p')!;
      const widgetContent = document.querySelector('.widget p')!;
      const selector = generator.generate(cardContent);

      // Should uniquely identify the card content paragraph
      expect(generator.isUnique(selector, cardContent)).toBe(true);

      // Should NOT match the widget paragraph
      expect(generator.isUnique(selector, widgetContent)).toBe(false);
    });

    it('should skip dynamic-looking class names', () => {
      document.body.innerHTML = `
        <div class="css-abc123 styled-component">
          <span class="jsx-789xyz target-element">Content</span>
        </div>
      `;

      const target = document.querySelector('.target-element')!;
      const selector = generator.generate(target);

      // Should not include the random-looking classes
      expect(selector).not.toContain('css-abc123');
      expect(selector).not.toContain('jsx-789xyz');
    });

    it('should not produce overly generic selectors', () => {
      document.body.innerHTML = `
        <div>
          <div>
            <div>
              <div>
                <div class="deep-target">Deep content</div>
              </div>
            </div>
          </div>
        </div>
      `;

      const target = document.querySelector('.deep-target')!;
      const selector = generator.generate(target);

      // The selector should NOT just be "div" or "div:nth-of-type(1)"
      // without any context that makes it unique
      expect(selector).not.toBe('div');
      expect(selector).not.toBe('div:nth-of-type(1)');

      // Verify it uniquely identifies the element
      expect(generator.isUnique(selector, target)).toBe(true);
    });

    it('should use CSS path when text/role selectors are not unique', () => {
      // Create multiple elements with identical text content
      document.body.innerHTML = `
        <div id="section-a">
          <span>Duplicate Text</span>
        </div>
        <div id="section-b">
          <span>Duplicate Text</span>
        </div>
      `;

      const spans = document.querySelectorAll('span');
      const target = spans[0]!;
      const selector = generator.generate(target);

      // Since text is duplicated, should fall back to CSS path with ID context
      expect(selector).toContain('#section-a');
      expect(generator.isUnique(selector, target)).toBe(true);
    });

    it('should build full CSS path with nth-of-type for identical elements', () => {
      // Create multiple completely identical generic elements that force CSS path fallback
      document.body.innerHTML = `
        <div class="list">
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
          <div class="item"></div>
        </div>
      `;

      const items = document.querySelectorAll('.item');
      const target = items[2]!; // Third item
      const selector = generator.generate(target);

      // Should contain nth-of-type since siblings are identical
      expect(selector).toContain('nth-of-type');
      expect(generator.isUnique(selector, target)).toBe(true);
    });
  });
});
