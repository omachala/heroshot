/**
 * Smart Selector Generator
 *
 * Generates stable, Playwright-compatible selectors prioritizing:
 * 1. data-testid, data-test, data-cy (most stable)
 * 2. ARIA role with accessible name
 * 3. Unique text content
 * 4. Placeholder/label attributes
 * 5. Stable CSS ID
 * 6. Fallback CSS path
 *
 * @see https://playwright.dev/docs/locators
 */

import { getAccessibleName, getAriaRole, isGuidLike } from './ariaUtilities';

/**
 * cssEscape polyfill for jsdom compatibility
 */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && cssEscape) {
    return cssEscape(value);
  }
  // Simple fallback: escape special CSS characters
  return value.replaceAll(/([^\w-])/g, String.raw`\$1`);
}

/**
 * Selector candidate with score (lower = better)
 */
export type SelectorCandidate = {
  selector: string;
  score: number;
  type:
    | 'testId'
    | 'role'
    | 'text'
    | 'placeholder'
    | 'label'
    | 'cssId'
    | 'cssClass'
    | 'nth'
    | 'fallback';
};

/**
 * Options for selector generation
 */
export type SelectorOptions = {
  /** Test ID attributes to check (default: ['data-testid', 'data-test', 'data-cy']) */
  testIdAttributes?: string[];
  /** Maximum text length for text selectors (default: 50) */
  maxTextLength?: number;
  /** Root for uniqueness testing (default: document) */
  root?: ParentNode;
};

/**
 * Scoring system for selector types (lower = better)
 */
const SELECTOR_SCORES: {
  readonly testId: 1;
  readonly otherTestId: 2;
  readonly roleWithName: 100;
  readonly placeholder: 120;
  readonly label: 140;
  readonly text: 180;
  readonly title: 200;
  readonly cssId: 500;
  readonly roleWithoutName: 510;
  readonly cssClass: 520;
  readonly cssTag: 530;
  readonly nth: 10_000;
  readonly fallback: 100_000;
} = {
  testId: 1,
  otherTestId: 2,
  roleWithName: 100,
  placeholder: 120,
  label: 140,
  text: 180,
  title: 200,
  cssId: 500,
  roleWithoutName: 510,
  cssClass: 520,
  cssTag: 530,
  nth: 10_000,
  fallback: 100_000,
};

const DEFAULT_OPTIONS: Required<SelectorOptions> = {
  testIdAttributes: ['data-testid', 'data-test', 'data-cy'],
  maxTextLength: 50,
  root: document,
};

/**
 * Smart selector generator class
 */
export class SelectorGenerator {
  private options: Required<SelectorOptions>;

  constructor(options?: SelectorOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Generate the best selector for an element
   */
  generate(element: Element): string {
    const candidates = this.generateCandidates(element);

    // Find first unique candidate
    for (const candidate of candidates) {
      if (this.isUnique(candidate.selector, element)) {
        return candidate.selector;
      }
    }

    // No unique selector found, add context or use nth
    return this.generateWithContext(element, candidates);
  }

  /**
   * Generate multiple selector candidates sorted by score
   */
  generateCandidates(element: Element): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];

    // Check shadow DOM path
    const shadowPath = this.getShadowPath(element);
    const needsShadowPiercing = shadowPath.length > 1;

    // For shadow DOM, we need to build path from outermost host
    if (needsShadowPiercing) {
      return this.generateShadowCandidates(element, shadowPath);
    }

    // 1. Test ID attributes
    this.addTestIdCandidates(element, candidates);

    // 2. Role-based selectors
    this.addRoleCandidates(element, candidates);

    // 3. Text-based selectors
    this.addTextCandidates(element, candidates);

    // 4. CSS ID (if stable)
    this.addIdCandidates(element, candidates);

    // 5. CSS class/tag fallback
    this.addCssCandidates(element, candidates);

    // Sort by score
    candidates.sort((a, b) => a.score - b.score);

    return candidates;
  }

  /**
   * Test if a selector uniquely identifies the element
   */
  isUnique(selector: string, element: Element): boolean {
    try {
      const matches = this.queryAll(selector);
      return matches.length === 1 && matches[0] === element;
    } catch {
      return false;
    }
  }

  /**
   * Query all elements matching a selector (supports Playwright formats)
   */
  private queryAll(selector: string): Element[] {
    const root = this.options.root;

    // Handle Playwright selector formats
    if (selector.startsWith('role=')) {
      return this.queryByRole(selector);
    }
    if (selector.startsWith('text=')) {
      return this.queryByText(selector);
    }
    if (selector.includes(' >> ')) {
      return this.queryByShadow(selector);
    }

    // Standard CSS selector
    try {
      return [...root.querySelectorAll(selector)];
    } catch {
      return [];
    }
  }

  /**
   * Query by role selector
   */
  private queryByRole(selector: string): Element[] {
    // Parse role=button[name="Submit"]
    const match = /^role=(\w+)(?:\[name="([^"]+)"\])?$/.exec(selector);
    if (!match?.[1]) return [];

    const role = match[1];
    const name = match[2];
    const results: Element[] = [];

    const all = this.options.root.querySelectorAll('*');
    for (const element of all) {
      const elementRole = getAriaRole(element);
      if (elementRole !== role) continue;

      if (name) {
        const elementName = getAccessibleName(element);
        if (elementName !== name) continue;
      }

      results.push(element);
    }

    return results;
  }

  /**
   * Query by text selector
   */
  private queryByText(selector: string): Element[] {
    // Parse text="Submit"
    const match = /^text="([^"]+)"$/.exec(selector);
    if (!match?.[1]) return [];

    const targetText = match[1];
    const results: Element[] = [];

    const rootNode = this.options.root instanceof Node ? this.options.root : document;
    const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);

    const textNodes: Text[] = [];
    let node = walker.nextNode();
    while (node) {
      if (node instanceof Text) {
        textNodes.push(node);
      }
      node = walker.nextNode();
    }

    for (const textNode of textNodes) {
      const text = this.normalizeWhitespace(textNode.textContent ?? '');
      if (text === targetText && textNode.parentElement) {
        results.push(textNode.parentElement);
      }
    }

    return results;
  }

  /**
   * Query by shadow-piercing selector
   */
  private queryByShadow(selector: string): Element[] {
    const parts = selector.split(' >> ');
    const rootDocument = this.options.root instanceof Document ? this.options.root : document;
    let currentRoots: (Element | Document | ShadowRoot)[] = [rootDocument];

    for (const part of parts) {
      const nextRoots: (Element | ShadowRoot)[] = [];

      for (const root of currentRoots) {
        try {
          const matches = root.querySelectorAll(part);
          for (const match of matches) {
            nextRoots.push(match);
            if (match.shadowRoot) {
              nextRoots.push(match.shadowRoot);
            }
          }
        } catch {
          // Invalid selector part
        }
      }

      currentRoots = nextRoots;
    }

    return currentRoots.filter((r): r is Element => r instanceof Element);
  }

  /**
   * Get shadow DOM path from document to element
   */
  private getShadowPath(element: Element): Element[] {
    const path: Element[] = [];
    let current: Element | null = element;

    while (current) {
      path.unshift(current);
      const root = current.getRootNode();

      current = root instanceof ShadowRoot ? root.host : null;
    }

    return path;
  }

  /**
   * Generate candidates for shadow DOM elements
   */
  private generateShadowCandidates(element: Element, shadowPath: Element[]): SelectorCandidate[] {
    // Build selector from outermost to innermost
    const parts: string[] = [];

    for (let index = 0; index < shadowPath.length; index++) {
      const element_ = shadowPath[index];
      if (!element_) continue;
      const isLast = index === shadowPath.length - 1;

      // For hosts, use simple selector (ID or tag.class)
      if (isLast) {
        // For the target element, get best local selector
        const localCandidates: SelectorCandidate[] = [];
        this.addTestIdCandidates(element_, localCandidates);
        this.addRoleCandidates(element_, localCandidates);
        this.addTextCandidates(element_, localCandidates);
        this.addIdCandidates(element_, localCandidates);
        this.addCssCandidates(element_, localCandidates);

        localCandidates.sort((a, b) => a.score - b.score);
        const best = localCandidates[0]?.selector || element_.tagName.toLowerCase();
        parts.push(best);
      } else {
        if (element_.id && !isGuidLike(element_.id)) {
          parts.push(`#${element_.id}`);
        } else {
          let selector = element_.tagName.toLowerCase();
          if (element_.className && typeof element_.className === 'string') {
            const classes = element_.className.split(/\s+/).filter(Boolean).slice(0, 1);
            if (classes.length > 0) {
              selector += '.' + classes.join('.');
            }
          }
          parts.push(selector);
        }
      }
    }

    const selector = parts.join(' >> ');
    return [{ selector, score: SELECTOR_SCORES.fallback, type: 'fallback' }];
  }

  /**
   * Add test ID candidates
   */
  private addTestIdCandidates(element: Element, candidates: SelectorCandidate[]): void {
    for (let index = 0; index < this.options.testIdAttributes.length; index++) {
      const attribute = this.options.testIdAttributes[index];
      if (!attribute) continue;
      const value = element.getAttribute(attribute);
      if (value) {
        candidates.push({
          selector: `[${attribute}="${this.escapeAttributeValue(value)}"]`,
          score: index === 0 ? SELECTOR_SCORES.testId : SELECTOR_SCORES.otherTestId,
          type: 'testId',
        });
      }
    }
  }

  /**
   * Add role-based candidates
   */
  private addRoleCandidates(element: Element, candidates: SelectorCandidate[]): void {
    const role = getAriaRole(element);
    if (!role) return;

    const name = getAccessibleName(element);
    if (name) {
      candidates.push({
        selector: `role=${role}[name="${this.escapeAttributeValue(name)}"]`,
        score: SELECTOR_SCORES.roleWithName,
        type: 'role',
      });
    } else {
      candidates.push({
        selector: `role=${role}`,
        score: SELECTOR_SCORES.roleWithoutName,
        type: 'role',
      });
    }
  }

  /**
   * Add text-based candidates
   */
  private addTextCandidates(element: Element, candidates: SelectorCandidate[]): void {
    const text = this.normalizeWhitespace(element.textContent ?? '');
    if (!text || text.length < 2) return;

    // Truncate long text
    let truncated = text;
    if (truncated.length > this.options.maxTextLength) {
      truncated = truncated.slice(0, this.options.maxTextLength).trim();
    }

    candidates.push({
      selector: `text="${this.escapeAttributeValue(truncated)}"`,
      score: SELECTOR_SCORES.text,
      type: 'text',
    });
  }

  /**
   * Add CSS ID candidates
   */
  private addIdCandidates(element: Element, candidates: SelectorCandidate[]): void {
    const id = element.id;
    if (!id || id.startsWith('heroshot') || isGuidLike(id)) return;

    candidates.push({
      selector: `#${cssEscape(id)}`,
      score: SELECTOR_SCORES.cssId,
      type: 'cssId',
    });
  }

  /**
   * Add CSS class/tag candidates
   */
  private addCssCandidates(element: Element, candidates: SelectorCandidate[]): void {
    const tagName = element.tagName.toLowerCase();

    // Tag + class
    if (element.className && typeof element.className === 'string') {
      const classes = element.className
        .split(/\s+/)
        .filter(c => c && !c.startsWith('heroshot'))
        .slice(0, 2);
      if (classes.length > 0) {
        candidates.push({
          selector: `${tagName}.${classes.map(c => cssEscape(c)).join('.')}`,
          score: SELECTOR_SCORES.cssClass,
          type: 'cssClass',
        });
      }
    }

    // Tag only
    candidates.push({
      selector: tagName,
      score: SELECTOR_SCORES.cssTag,
      type: 'cssClass',
    });
  }

  /**
   * Generate selector with added context for uniqueness
   */
  private generateWithContext(element: Element, candidates: SelectorCandidate[]): string {
    // Try adding parent context
    const parent = element.parentElement;
    if (parent && !parent.id?.startsWith('heroshot')) {
      const parentId = parent.id && !isGuidLike(parent.id) ? `#${cssEscape(parent.id)} ` : '';
      const firstCandidate = candidates[0];
      if (parentId && firstCandidate) {
        const best = firstCandidate.selector;
        const withParent = parentId + best;
        if (this.isUnique(withParent, element)) {
          return withParent;
        }
      }
    }

    // Fall back to nth-of-type
    const tagName = element.tagName.toLowerCase();
    const siblings = parent
      ? [...parent.children].filter(c => c.tagName === element.tagName)
      : [element];
    const index = siblings.indexOf(element);

    if (index !== -1 && siblings.length > 1) {
      const nth = `${tagName}:nth-of-type(${index + 1})`;
      const parentSelector =
        parent?.id && !isGuidLike(parent.id) ? `#${cssEscape(parent.id)} ` : '';
      return parentSelector + nth;
    }

    // Last resort: use first candidate
    return candidates[0]?.selector || tagName;
  }

  /**
   * Normalize whitespace in text
   */
  private normalizeWhitespace(text: string): string {
    return text.replaceAll(/\s+/g, ' ').trim();
  }

  /**
   * Escape special characters in attribute values
   */
  private escapeAttributeValue(value: string): string {
    return value.replaceAll('"', String.raw`\"`).replaceAll('\n', ' ');
  }
}

/**
 * Default singleton instance
 */
const defaultGenerator = new SelectorGenerator();

/**
 * Convenience function - drop-in replacement for getSelector
 */
export function generateSelector(element: Element): string {
  return defaultGenerator.generate(element);
}
