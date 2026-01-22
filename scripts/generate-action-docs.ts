/**
 * Generates API Reference markdown from Zod schemas.
 *
 * Usage: npx tsx scripts/generate-action-docs.ts
 * Output: docs/docs/actions-reference.md, docs/docs/config-reference.md, etc.
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { actionsSchema } from '../src/actionSchema';
import { configSchema, screenshotSchema, browserSchema } from '../src/schema';

// ─── Types ───────────────────────────────────────────────────────────────────

interface JsonSchemaProperty {
  type?: string | string[];
  const?: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
}

interface JsonSchemaObject {
  type: 'object';
  description?: string;
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface PageConfig {
  schema: z.ZodType;
  outFile: string;
  title: string;
  description: string;
  /** For discriminated unions (like actions) - generates per-variant sections */
  mode: 'object' | 'discriminated-union';
  /** Link back to the hand-written overview */
  backLink?: string;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatType(prop: JsonSchemaProperty): string {
  if (prop.const) return `\`"${prop.const}"\``;
  if (prop.enum) return prop.enum.map(v => `\`"${v}"\``).join(' \\| ');
  if (prop.type === 'array') {
    if (prop.items?.enum) {
      return `(${prop.items.enum.map(v => `\`"${v}"\``).join(' \\| ')})[]`;
    }
    if (prop.items?.type === 'object') return 'object[]';
    return `${prop.items?.type ?? 'any'}[]`;
  }
  if (prop.type === 'number' || prop.type === 'integer') return 'number';
  if (prop.type === 'boolean') return 'boolean';
  if (prop.type === 'string') return 'string';
  if (prop.type === 'object') {
    if (prop.properties) return 'object';
    return 'Record';
  }
  return String(prop.type ?? 'any');
}

function formatDefault(prop: JsonSchemaProperty): string {
  if (prop.default === undefined) return '-';
  if (typeof prop.default === 'string') return `\`"${prop.default}"\``;
  return `\`${JSON.stringify(prop.default)}\``;
}

// ─── Example generation ──────────────────────────────────────────────────────

const EXAMPLE_VALUES: Record<string, unknown> = {
  selector: '.my-element',
  text: 'Hello world',
  url: '/dashboard',
  key: 'Enter',
  function: '() => { document.querySelector(".ad").remove() }',
  from: '.draggable-item',
  to: '.drop-zone',
  accept: true,
  width: 375,
  height: 667,
  time: 0.5,
  textGone: 'Loading...',
  back: true,
  doubleClick: true,
  submit: true,
  slowly: true,
  promptText: 'my answer',
  button: 'right',
  modifiers: ['Control'],
  values: ['option-1', 'option-2'],
  paths: ['./screenshot.png'],
  name: 'My Screenshot',
  outputDirectory: 'screenshots',
  outputFormat: 'png',
  jpegQuality: 80,
  workers: 4,
  deviceScaleFactor: 2,
  colorScheme: 'light',
};

function exampleValue(name: string, prop: JsonSchemaProperty): unknown {
  if (name in EXAMPLE_VALUES) return EXAMPLE_VALUES[name];
  if (prop.default !== undefined) return prop.default;
  if (prop.enum) return prop.enum[0];
  if (prop.type === 'string') return 'value';
  if (prop.type === 'number' || prop.type === 'integer') return prop.minimum ?? 1;
  if (prop.type === 'boolean') return true;
  if (prop.type === 'array') return [];
  if (prop.type === 'object') return {};
  return 'value';
}

// ─── Object schema rendering ─────────────────────────────────────────────────

function renderObjectTable(
  schema: JsonSchemaObject,
  opts: { showDefault?: boolean } = {}
): string[] {
  const required = new Set(schema.required ?? []);
  const lines: string[] = [];
  const props = Object.entries(schema.properties);

  if (props.length === 0) return lines;

  if (opts.showDefault) {
    lines.push('| Property | Type | Default | Description |');
    lines.push('| --- | --- | --- | --- |');
  } else {
    lines.push('| Property | Type | Required | Description |');
    lines.push('| --- | --- | --- | --- |');
  }

  for (const [name, prop] of props) {
    const type = formatType(prop);
    const desc = escapeHtml(prop.description ?? '');

    if (opts.showDefault) {
      const def = formatDefault(prop);
      lines.push(`| \`${name}\` | ${type} | ${def} | ${desc} |`);
    } else {
      const isRequired = required.has(name);
      lines.push(`| \`${name}\` | ${type} | ${isRequired ? 'yes' : 'no'} | ${desc} |`);
    }

    // Expand nested object properties
    if (prop.type === 'object' && prop.properties) {
      const subRequired = new Set(prop.required ?? []);
      for (const [subName, subProp] of Object.entries(prop.properties)) {
        const subType = formatType(subProp as JsonSchemaProperty);
        const subDesc = escapeHtml((subProp as JsonSchemaProperty).description ?? '');
        if (opts.showDefault) {
          const subDef = formatDefault(subProp as JsonSchemaProperty);
          lines.push(`| ↳ \`${name}.${subName}\` | ${subType} | ${subDef} | ${subDesc} |`);
        } else {
          const subReq = subRequired.has(subName);
          lines.push(
            `| ↳ \`${name}.${subName}\` | ${subType} | ${subReq ? 'yes' : 'no'} | ${subDesc} |`
          );
        }
      }
    }

    // Expand array of objects
    if (prop.type === 'array' && prop.items?.type === 'object') {
      const subProps = (prop.items as JsonSchemaObject).properties;
      const subRequired = new Set((prop.items as JsonSchemaObject).required ?? []);
      if (subProps) {
        for (const [subName, subProp] of Object.entries(subProps)) {
          const subType = formatType(subProp as JsonSchemaProperty);
          const subDesc = escapeHtml((subProp as JsonSchemaProperty).description ?? '');
          if (opts.showDefault) {
            const subDef = formatDefault(subProp as JsonSchemaProperty);
            lines.push(`| ↳ \`${name}[].${subName}\` | ${subType} | ${subDef} | ${subDesc} |`);
          } else {
            const subReq = subRequired.has(subName);
            lines.push(
              `| ↳ \`${name}[].${subName}\` | ${subType} | ${subReq ? 'yes' : 'no'} | ${subDesc} |`
            );
          }
        }
      }
    }
  }

  return lines;
}

// ─── Discriminated union rendering (actions) ─────────────────────────────────

function renderDiscriminatedUnionSection(schema: JsonSchemaObject): string {
  const actionType = schema.properties['type']?.const;
  if (!actionType) return '';

  const required = new Set(schema.required ?? []);
  const lines: string[] = [];

  lines.push(`### \`${actionType}\``);
  lines.push('');
  if (schema.description) {
    lines.push(escapeHtml(schema.description));
    lines.push('');
  }

  // Properties table
  const props = Object.entries(schema.properties).filter(([key]) => key !== 'type');
  if (props.length > 0) {
    lines.push('| Property | Type | Required | Description |');
    lines.push('| --- | --- | --- | --- |');

    for (const [name, prop] of props) {
      const isRequired = required.has(name);
      const type = formatType(prop);
      const desc = escapeHtml(prop.description ?? '');
      lines.push(`| \`${name}\` | ${type} | ${isRequired ? 'yes' : 'no'} | ${desc} |`);

      if (prop.type === 'array' && prop.items?.type === 'object') {
        const subProps = (prop.items as JsonSchemaObject).properties;
        const subRequired = new Set((prop.items as JsonSchemaObject).required ?? []);
        if (subProps) {
          for (const [subName, subProp] of Object.entries(subProps)) {
            const subType = formatType(subProp as JsonSchemaProperty);
            const subReq = subRequired.has(subName);
            const subDesc = escapeHtml((subProp as JsonSchemaProperty).description ?? '');
            lines.push(
              `| ↳ \`${name}[].${subName}\` | ${subType} | ${subReq ? 'yes' : 'no'} | ${subDesc} |`
            );
          }
        }
      }
    }
    lines.push('');
  }

  // JSON examples
  const minimal: Record<string, unknown> = { type: actionType };
  for (const [name, prop] of Object.entries(schema.properties)) {
    if (name === 'type' || !required.has(name)) continue;
    if (name === 'fields' && prop.type === 'array' && prop.items?.type === 'object') {
      minimal[name] = [{ selector: '#email', value: 'demo@example.com', fieldType: 'textbox' }];
    } else {
      minimal[name] = exampleValue(name, prop);
    }
  }

  const optionalFields = Object.entries(schema.properties).filter(
    ([name]) => name !== 'type' && !required.has(name)
  );

  if (optionalFields.length > 0) {
    const extended: Record<string, unknown> = { ...minimal };
    for (const [name, prop] of optionalFields) {
      extended[name] = exampleValue(name, prop);
    }
    lines.push('```json');
    lines.push('// minimal');
    lines.push(JSON.stringify(minimal, null, 2));
    lines.push('');
    lines.push('// with options');
    lines.push(JSON.stringify(extended, null, 2));
    lines.push('```');
  } else {
    lines.push('```json');
    lines.push(JSON.stringify(minimal, null, 2));
    lines.push('```');
  }
  lines.push('');

  return lines.join('\n');
}

// ─── Page generation ─────────────────────────────────────────────────────────

function generatePage(config: PageConfig): void {
  const jsonSchema = z.toJSONSchema(config.schema);
  const lines: string[] = [];

  // Frontmatter
  lines.push('---');
  lines.push(`description: ${config.description}`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${config.title}`);
  lines.push('');
  if (config.backLink) {
    lines.push(`Back to [Configuration overview](${config.backLink}).`);
    lines.push('');
  }

  if (config.mode === 'object') {
    const schema = jsonSchema as unknown as JsonSchemaObject;
    const table = renderObjectTable(schema, { showDefault: true });
    lines.push(...table);
    lines.push('');

    // Generate a full example JSON
    const example: Record<string, unknown> = {};
    for (const [name, prop] of Object.entries(schema.properties)) {
      example[name] = exampleValue(name, prop);
    }
    lines.push('## Example');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(example, null, 2));
    lines.push('```');
    lines.push('');
  } else {
    // Discriminated union (actions)
    const arraySchema = jsonSchema as { items: { oneOf: JsonSchemaObject[] } };
    for (const variant of arraySchema.items.oneOf) {
      lines.push(renderDiscriminatedUnionSection(variant));
    }
  }

  const outPath = resolve(import.meta.dirname, '..', config.outFile);
  writeFileSync(outPath, lines.join('\n'));
  console.log(`Generated: ${outPath}`);
}

// ─── Config ──────────────────────────────────────────────────────────────────

const pages: PageConfig[] = [
  {
    schema: actionsSchema,
    outFile: 'docs/docs/actions-reference.md',
    title: 'Actions API Reference',
    description: 'Complete reference for all pre-screenshot actions with properties and examples.',
    mode: 'discriminated-union',
    backLink: './config#actions',
  },
  {
    schema: screenshotSchema,
    outFile: 'docs/docs/screenshot-reference.md',
    title: 'Screenshot Definition Reference',
    description: 'All properties available in a screenshot definition object.',
    mode: 'object',
    backLink: './config#screenshot-definition',
  },
  {
    schema: browserSchema,
    outFile: 'docs/docs/browser-reference.md',
    title: 'Browser Settings Reference',
    description: 'All browser configuration options for viewport, color scheme, and device scale.',
    mode: 'object',
    backLink: './config#browser-settings',
  },
  {
    schema: configSchema,
    outFile: 'docs/docs/config-reference.md',
    title: 'Global Config Reference',
    description: 'All top-level configuration options for heroshot config.json.',
    mode: 'object',
    backLink: './config',
  },
];

for (const page of pages) {
  generatePage(page);
}
