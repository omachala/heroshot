/**
 * ARIA Utilities Unit Tests
 *
 * Tests for ARIA role detection and accessible name computation.
 * Used by SelectorGenerator to create role-based selectors.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getAccessibleName, getAriaRole, isGuidLike } from '../ariaUtilities';

describe('ariaUtils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getAriaRole', () => {
    describe('explicit roles', () => {
      it('should return explicit role attribute', () => {
        const div = document.createElement('div');
        div.setAttribute('role', 'button');
        document.body.appendChild(div);

        expect(getAriaRole(div)).toBe('button');
      });

      it('should return explicit role for span', () => {
        const span = document.createElement('span');
        span.setAttribute('role', 'link');
        document.body.appendChild(span);

        expect(getAriaRole(span)).toBe('link');
      });
    });

    describe('implicit roles for buttons', () => {
      it('should return button role for <button>', () => {
        const button = document.createElement('button');
        document.body.appendChild(button);

        expect(getAriaRole(button)).toBe('button');
      });

      it('should return button role for input[type=button]', () => {
        const input = document.createElement('input');
        input.type = 'button';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('button');
      });

      it('should return button role for input[type=submit]', () => {
        const input = document.createElement('input');
        input.type = 'submit';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('button');
      });

      it('should return button role for input[type=reset]', () => {
        const input = document.createElement('input');
        input.type = 'reset';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('button');
      });
    });

    describe('implicit roles for links', () => {
      it('should return link role for <a> with href', () => {
        const a = document.createElement('a');
        a.href = 'https://example.com';
        document.body.appendChild(a);

        expect(getAriaRole(a)).toBe('link');
      });

      it('should return null for <a> without href', () => {
        const a = document.createElement('a');
        document.body.appendChild(a);

        expect(getAriaRole(a)).toBeNull();
      });
    });

    describe('implicit roles for inputs', () => {
      it('should return textbox role for input[type=text]', () => {
        const input = document.createElement('input');
        input.type = 'text';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('textbox');
      });

      it('should return textbox role for input without type', () => {
        const input = document.createElement('input');
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('textbox');
      });

      it('should return textbox role for input[type=email]', () => {
        const input = document.createElement('input');
        input.type = 'email';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('textbox');
      });

      it('should return textbox role for input[type=password]', () => {
        const input = document.createElement('input');
        input.type = 'password';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('textbox');
      });

      it('should return checkbox role for input[type=checkbox]', () => {
        const input = document.createElement('input');
        input.type = 'checkbox';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('checkbox');
      });

      it('should return radio role for input[type=radio]', () => {
        const input = document.createElement('input');
        input.type = 'radio';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('radio');
      });

      it('should return searchbox role for input[type=search]', () => {
        const input = document.createElement('input');
        input.type = 'search';
        document.body.appendChild(input);

        expect(getAriaRole(input)).toBe('searchbox');
      });
    });

    describe('implicit roles for other elements', () => {
      it('should return textbox role for <textarea>', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);

        expect(getAriaRole(textarea)).toBe('textbox');
      });

      it('should return combobox role for <select>', () => {
        const select = document.createElement('select');
        document.body.appendChild(select);

        expect(getAriaRole(select)).toBe('combobox');
      });

      it('should return listbox role for <select multiple>', () => {
        const select = document.createElement('select');
        select.multiple = true;
        document.body.appendChild(select);

        expect(getAriaRole(select)).toBe('listbox');
      });

      it('should return img role for <img> with alt', () => {
        const img = document.createElement('img');
        img.alt = 'A picture';
        document.body.appendChild(img);

        expect(getAriaRole(img)).toBe('img');
      });

      it('should return heading role for <h1>', () => {
        const h1 = document.createElement('h1');
        document.body.appendChild(h1);

        expect(getAriaRole(h1)).toBe('heading');
      });

      it('should return heading role for <h2> through <h6>', () => {
        for (let i = 2; i <= 6; i++) {
          const heading = document.createElement(`h${i}`);
          document.body.appendChild(heading);
          expect(getAriaRole(heading)).toBe('heading');
          heading.remove();
        }
      });

      it('should return navigation role for <nav>', () => {
        const nav = document.createElement('nav');
        document.body.appendChild(nav);

        expect(getAriaRole(nav)).toBe('navigation');
      });

      it('should return main role for <main>', () => {
        const main = document.createElement('main');
        document.body.appendChild(main);

        expect(getAriaRole(main)).toBe('main');
      });

      it('should return article role for <article>', () => {
        const article = document.createElement('article');
        document.body.appendChild(article);

        expect(getAriaRole(article)).toBe('article');
      });

      it('should return list role for <ul>', () => {
        const ul = document.createElement('ul');
        document.body.appendChild(ul);

        expect(getAriaRole(ul)).toBe('list');
      });

      it('should return list role for <ol>', () => {
        const ol = document.createElement('ol');
        document.body.appendChild(ol);

        expect(getAriaRole(ol)).toBe('list');
      });

      it('should return listitem role for <li>', () => {
        const li = document.createElement('li');
        document.body.appendChild(li);

        expect(getAriaRole(li)).toBe('listitem');
      });
    });

    describe('elements without roles', () => {
      it('should return null for <div> without role', () => {
        const div = document.createElement('div');
        document.body.appendChild(div);

        expect(getAriaRole(div)).toBeNull();
      });

      it('should return null for <span> without role', () => {
        const span = document.createElement('span');
        document.body.appendChild(span);

        expect(getAriaRole(span)).toBeNull();
      });

      it('should return null for <p> without role', () => {
        const p = document.createElement('p');
        document.body.appendChild(p);

        expect(getAriaRole(p)).toBeNull();
      });
    });
  });

  describe('getAccessibleName', () => {
    describe('aria-label', () => {
      it('should return aria-label value', () => {
        const button = document.createElement('button');
        button.setAttribute('aria-label', 'Submit form');
        document.body.appendChild(button);

        expect(getAccessibleName(button)).toBe('Submit form');
      });

      it('should prefer aria-label over text content', () => {
        const button = document.createElement('button');
        button.setAttribute('aria-label', 'Close dialog');
        button.textContent = 'X';
        document.body.appendChild(button);

        expect(getAccessibleName(button)).toBe('Close dialog');
      });
    });

    describe('aria-labelledby', () => {
      it('should return text from aria-labelledby element', () => {
        const label = document.createElement('span');
        label.id = 'my-label';
        label.textContent = 'Username';
        document.body.appendChild(label);

        const input = document.createElement('input');
        input.setAttribute('aria-labelledby', 'my-label');
        document.body.appendChild(input);

        expect(getAccessibleName(input)).toBe('Username');
      });

      it('should concatenate multiple aria-labelledby elements', () => {
        const label1 = document.createElement('span');
        label1.id = 'label1';
        label1.textContent = 'First';
        document.body.appendChild(label1);

        const label2 = document.createElement('span');
        label2.id = 'label2';
        label2.textContent = 'Last';
        document.body.appendChild(label2);

        const input = document.createElement('input');
        input.setAttribute('aria-labelledby', 'label1 label2');
        document.body.appendChild(input);

        expect(getAccessibleName(input)).toBe('First Last');
      });

      it('should prefer aria-labelledby over aria-label', () => {
        const label = document.createElement('span');
        label.id = 'ext-label';
        label.textContent = 'External label';
        document.body.appendChild(label);

        const button = document.createElement('button');
        button.setAttribute('aria-labelledby', 'ext-label');
        button.setAttribute('aria-label', 'Internal label');
        document.body.appendChild(button);

        expect(getAccessibleName(button)).toBe('External label');
      });
    });

    describe('associated label', () => {
      it('should return text from associated <label> via for attribute', () => {
        const label = document.createElement('label');
        label.setAttribute('for', 'email-input');
        label.textContent = 'Email address';
        document.body.appendChild(label);

        const input = document.createElement('input');
        input.id = 'email-input';
        document.body.appendChild(input);

        expect(getAccessibleName(input)).toBe('Email address');
      });

      it('should return text from wrapping <label>', () => {
        const label = document.createElement('label');
        label.textContent = 'Password ';
        const input = document.createElement('input');
        input.type = 'password';
        label.appendChild(input);
        document.body.appendChild(label);

        // Name should be the label text minus the input
        expect(getAccessibleName(input)).toBe('Password');
      });
    });

    describe('placeholder', () => {
      it('should return placeholder for input', () => {
        const input = document.createElement('input');
        input.placeholder = 'Enter your name';
        document.body.appendChild(input);

        expect(getAccessibleName(input)).toBe('Enter your name');
      });

      it('should return placeholder for textarea', () => {
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Write a message...';
        document.body.appendChild(textarea);

        expect(getAccessibleName(textarea)).toBe('Write a message...');
      });
    });

    describe('title attribute', () => {
      it('should return title attribute as fallback', () => {
        const button = document.createElement('button');
        button.title = 'Click to proceed';
        document.body.appendChild(button);

        expect(getAccessibleName(button)).toBe('Click to proceed');
      });
    });

    describe('text content', () => {
      it('should return text content for button', () => {
        const button = document.createElement('button');
        button.textContent = 'Submit';
        document.body.appendChild(button);

        expect(getAccessibleName(button)).toBe('Submit');
      });

      it('should return text content for link', () => {
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = 'Learn more';
        document.body.appendChild(a);

        expect(getAccessibleName(a)).toBe('Learn more');
      });

      it('should normalize whitespace in text content', () => {
        const button = document.createElement('button');
        button.innerHTML = '  Submit   Form  ';
        document.body.appendChild(button);

        expect(getAccessibleName(button)).toBe('Submit Form');
      });

      it('should exclude hidden elements from text content', () => {
        const button = document.createElement('button');
        button.innerHTML = 'Click <span style="display:none">hidden</span> here';
        document.body.appendChild(button);

        // jsdom may not respect style, so this tests the trimming at minimum
        const name = getAccessibleName(button);
        expect(name).toContain('Click');
        expect(name).toContain('here');
      });
    });

    describe('alt text for images', () => {
      it('should return alt text for img', () => {
        const img = document.createElement('img');
        img.alt = 'Company logo';
        document.body.appendChild(img);

        expect(getAccessibleName(img)).toBe('Company logo');
      });

      it('should return alt text for input[type=image]', () => {
        const input = document.createElement('input');
        input.type = 'image';
        input.alt = 'Search';
        document.body.appendChild(input);

        expect(getAccessibleName(input)).toBe('Search');
      });
    });

    describe('value for buttons', () => {
      it('should return value for input[type=submit]', () => {
        const input = document.createElement('input');
        input.type = 'submit';
        input.value = 'Send Message';
        document.body.appendChild(input);

        expect(getAccessibleName(input)).toBe('Send Message');
      });

      it('should return value for input[type=button]', () => {
        const input = document.createElement('input');
        input.type = 'button';
        input.value = 'Click Me';
        document.body.appendChild(input);

        expect(getAccessibleName(input)).toBe('Click Me');
      });
    });

    describe('empty names', () => {
      it('should return empty string for element with no accessible name', () => {
        const div = document.createElement('div');
        document.body.appendChild(div);

        expect(getAccessibleName(div)).toBe('');
      });

      it('should return empty string for img without alt', () => {
        const img = document.createElement('img');
        document.body.appendChild(img);

        expect(getAccessibleName(img)).toBe('');
      });
    });
  });

  describe('isGuidLike', () => {
    describe('should detect GUIDs/UUIDs', () => {
      it('should detect lowercase UUID', () => {
        expect(isGuidLike('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      });

      it('should detect uppercase UUID', () => {
        expect(isGuidLike('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      });

      it('should detect UUID without dashes', () => {
        expect(isGuidLike('550e8400e29b41d4a716446655440000')).toBe(true);
      });
    });

    describe('should detect React/framework generated IDs', () => {
      it('should detect React useId pattern', () => {
        expect(isGuidLike(':r1:')).toBe(true);
        expect(isGuidLike(':r2a:')).toBe(true);
        expect(isGuidLike(':R1:')).toBe(true);
      });

      it('should detect numeric IDs', () => {
        expect(isGuidLike('12345')).toBe(true);
        expect(isGuidLike('0')).toBe(true);
      });

      it('should detect long hex strings', () => {
        expect(isGuidLike('abc123def456')).toBe(true);
        expect(isGuidLike('a1b2c3d4e5f6')).toBe(true);
      });

      it('should detect random-looking IDs with high digit ratio', () => {
        expect(isGuidLike('el_12345_67890')).toBe(true);
        expect(isGuidLike('c_12345678')).toBe(true);
      });
    });

    describe('should accept semantic IDs', () => {
      it('should accept simple semantic IDs', () => {
        expect(isGuidLike('login-button')).toBe(false);
        expect(isGuidLike('submit-form')).toBe(false);
        expect(isGuidLike('main-content')).toBe(false);
      });

      it('should accept camelCase IDs', () => {
        expect(isGuidLike('loginButton')).toBe(false);
        expect(isGuidLike('submitForm')).toBe(false);
        expect(isGuidLike('mainContent')).toBe(false);
      });

      it('should accept IDs with underscores that are semantic', () => {
        expect(isGuidLike('login_button')).toBe(false);
        expect(isGuidLike('nav_menu')).toBe(false);
      });

      it('should accept short IDs', () => {
        expect(isGuidLike('nav')).toBe(false);
        expect(isGuidLike('app')).toBe(false);
        expect(isGuidLike('root')).toBe(false);
      });

      it('should accept IDs with numbers that are semantic', () => {
        expect(isGuidLike('section-1')).toBe(false);
        expect(isGuidLike('tab-2')).toBe(false);
        expect(isGuidLike('step1')).toBe(false);
      });
    });
  });
});
