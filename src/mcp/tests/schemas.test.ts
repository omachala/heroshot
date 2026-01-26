/**
 * MCP schema validation tests.
 * Ensures all input schemas properly validate and reject invalid inputs.
 */

import { describe, expect, it } from 'vitest';
import { addOptionsSchema } from '../schemas/add';
import { listOptionsSchema } from '../schemas/list';
import { removeOptionsSchema } from '../schemas/remove';
import { snippetOptionsSchema } from '../schemas/snippet';
import { syncOptionsSchema } from '../schemas/sync';

describe('MCP Schemas', () => {
  describe('syncOptionsSchema', () => {
    it('should accept empty object (all optional)', () => {
      const result = syncOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid options', () => {
      const result = syncOptionsSchema.safeParse({
        configPath: '/path/to/config.json',
        filter: 'homepage',
        clean: true,
        workers: 4,
        sessionKey: 'encrypted-key',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid workers (non-integer)', () => {
      const result = syncOptionsSchema.safeParse({ workers: 2.5 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid workers (zero)', () => {
      const result = syncOptionsSchema.safeParse({ workers: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid workers (negative)', () => {
      const result = syncOptionsSchema.safeParse({ workers: -1 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid clean type', () => {
      const result = syncOptionsSchema.safeParse({ clean: 'yes' });
      expect(result.success).toBe(false);
    });
  });

  describe('listOptionsSchema', () => {
    it('should accept empty object', () => {
      const result = listOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept valid options', () => {
      const result = listOptionsSchema.safeParse({
        configPath: '/path/to/config.json',
        filter: 'dashboard',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid configPath type', () => {
      const result = listOptionsSchema.safeParse({ configPath: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('addOptionsSchema', () => {
    it('should accept valid screenshot with minimal fields', () => {
      const result = addOptionsSchema.safeParse({
        screenshot: {
          name: 'Homepage',
          url: 'https://example.com',
        },
      });
      expect(result.success).toBe(true);
    });

    it('should accept screenshot with all fields', () => {
      const result = addOptionsSchema.safeParse({
        configPath: '/path/to/config.json',
        screenshot: {
          name: 'Dashboard',
          url: 'https://example.com/dashboard',
          selector: '.main-content',
          viewports: ['desktop', '1024x768'],
          padding: { top: 10, right: 20, bottom: 10, left: 20 },
          actions: [
            { type: 'click', selector: '.dismiss' },
            { type: 'wait', time: 1 },
          ],
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject screenshot without name', () => {
      const result = addOptionsSchema.safeParse({
        screenshot: {
          url: 'https://example.com',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject screenshot without url', () => {
      const result = addOptionsSchema.safeParse({
        screenshot: {
          name: 'Test',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty screenshot object', () => {
      const result = addOptionsSchema.safeParse({
        screenshot: {},
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing screenshot field', () => {
      const result = addOptionsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject invalid action type', () => {
      const result = addOptionsSchema.safeParse({
        screenshot: {
          name: 'Test',
          url: 'https://example.com',
          actions: [{ type: 'invalid-action' }],
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('removeOptionsSchema', () => {
    it('should accept valid id', () => {
      const result = removeOptionsSchema.safeParse({
        id: 'abc12345',
      });
      expect(result.success).toBe(true);
    });

    it('should accept with configPath', () => {
      const result = removeOptionsSchema.safeParse({
        configPath: '/path/to/config.json',
        id: 'abc12345',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing id', () => {
      const result = removeOptionsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty id', () => {
      const result = removeOptionsSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });

    it('should reject non-string id', () => {
      const result = removeOptionsSchema.safeParse({ id: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('snippetOptionsSchema', () => {
    it('should accept empty object', () => {
      const result = snippetOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept all options', () => {
      const result = snippetOptionsSchema.safeParse({
        configPath: '/path/to/config.json',
        filter: 'homepage',
        pathPrefix: './images/',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid pathPrefix type', () => {
      const result = snippetOptionsSchema.safeParse({ pathPrefix: 123 });
      expect(result.success).toBe(false);
    });
  });
});
