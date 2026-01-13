/**
 * Unit tests for selector.ts
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { querySelectorPiercing, findElementBySelector } from '../selector';

describe('querySelectorPiercing', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('regular selectors (no shadow DOM)', () => {
    it('finds element by ID', () => {
      container.innerHTML = '<div id="target">Target</div>';
      const result = querySelectorPiercing('#target');
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Target');
    });

    it('finds element by class', () => {
      container.innerHTML = '<div class="my-class">Target</div>';
      const result = querySelectorPiercing('.my-class');
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Target');
    });

    it('finds nested element', () => {
      container.innerHTML = '<div class="parent"><span class="child">Nested</span></div>';
      const result = querySelectorPiercing('.parent .child');
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Nested');
    });

    it('returns null when element not found', () => {
      container.innerHTML = '<div>Content</div>';
      const result = querySelectorPiercing('#nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('shadow DOM selectors (>>>)', () => {
    it('pierces single shadow root', () => {
      const host = document.createElement('div');
      host.id = 'shadow-host';
      container.appendChild(host);

      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<span class="inner">Shadow Content</span>';

      const result = querySelectorPiercing('#shadow-host >>> .inner');
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Shadow Content');
    });

    it('pierces multiple shadow roots', () => {
      // Create outer host
      const outerHost = document.createElement('div');
      outerHost.id = 'outer-host';
      container.appendChild(outerHost);

      const outerShadow = outerHost.attachShadow({ mode: 'open' });
      outerShadow.innerHTML = '<div id="inner-host"></div>';

      // Create inner host within shadow
      const innerHost = outerShadow.querySelector('#inner-host')!;
      const innerShadow = innerHost.attachShadow({ mode: 'open' });
      innerShadow.innerHTML = '<button class="deep">Deep Button</button>';

      const result = querySelectorPiercing('#outer-host >>> #inner-host >>> .deep');
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Deep Button');
    });

    it('handles spaces around >>>', () => {
      const host = document.createElement('div');
      host.id = 'host';
      container.appendChild(host);

      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<span class="target">Content</span>';

      // With extra spaces
      const result = querySelectorPiercing('#host  >>>  .target');
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Content');
    });

    it('returns null when shadow root element not found', () => {
      const host = document.createElement('div');
      host.id = 'host';
      container.appendChild(host);

      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<span class="exists">Content</span>';

      const result = querySelectorPiercing('#host >>> .nonexistent');
      expect(result).toBeNull();
    });

    it('returns null when host element not found', () => {
      const result = querySelectorPiercing('#nonexistent >>> .inner');
      expect(result).toBeNull();
    });

    it('continues through element without shadow root', () => {
      container.innerHTML = '<div id="parent"><span class="child">Nested</span></div>';

      // Using >>> on non-shadow element should still work
      // It queries within the element itself
      const result = querySelectorPiercing('#parent >>> .child');
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Nested');
    });

    it('handles empty parts in selector', () => {
      container.innerHTML = '<div id="target">Target</div>';
      // Empty parts should be skipped
      const result = querySelectorPiercing('>>> #target');
      expect(result).toBeTruthy();
      expect(result?.textContent).toBe('Target');
    });
  });
});

describe('findElementBySelector', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('uses regular querySelector for non-shadow selectors', () => {
    container.innerHTML = '<div id="regular">Regular Element</div>';
    const result = findElementBySelector('#regular');
    expect(result).toBeTruthy();
    expect(result?.textContent).toBe('Regular Element');
  });

  it('uses querySelectorPiercing for shadow selectors', () => {
    const host = document.createElement('div');
    host.id = 'shadow-host';
    container.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<span class="shadow-content">Shadow</span>';

    const result = findElementBySelector('#shadow-host >>> .shadow-content');
    expect(result).toBeTruthy();
    expect(result?.textContent).toBe('Shadow');
  });

  it('returns null for non-existent regular selector', () => {
    const result = findElementBySelector('#does-not-exist');
    expect(result).toBeNull();
  });

  it('returns null for non-existent shadow selector', () => {
    const result = findElementBySelector('#host >>> .missing');
    expect(result).toBeNull();
  });
});
