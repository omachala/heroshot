// @ts-check
import eslint from '@eslint/js';
import barrelFiles from 'eslint-plugin-barrel-files';
import eslintComments from 'eslint-plugin-eslint-comments';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import regexp from 'eslint-plugin-regexp';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  // @ts-expect-error - flat config exists but types are incomplete
  promisePlugin.configs['flat/recommended'],
  unicorn.configs.recommended,
  sonarjs.configs.recommended,
  prettierConfig, // Must be last to disable conflicting formatting rules
  {
    plugins: {
      'barrel-files': barrelFiles,
      regexp,
      security,
      'eslint-comments': eslintComments,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
    rules: {
      // ===== TypeScript Strict Rules =====
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Allow ONLY `as const`; ban all other assertions (`as Type`, `<Type>expr`)
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression',
          message:
            'Type assertions (as Type) are disallowed. Use type guards/predicates instead. ' +
            'Exception: `as const` is allowed for literal narrowing.',
        },
        {
          selector: 'TSTypeAssertion',
          message:
            'Angle-bracket type assertions (<Type>expr) are disallowed. Use type guards/predicates instead.',
        },
        {
          selector: 'ExportAllDeclaration',
          message:
            'Re-exporting with export * is disallowed. ' +
            'Import the symbols and export them explicitly at their definition instead.',
        },
        {
          selector: 'ExportNamedDeclaration[source]',
          message:
            'Re-exporting with export { } from is disallowed. ' +
            'Import the symbols and export them explicitly at their definition instead.',
        },
        {
          // bans `arr.map(f => f.prop)` - prefer destructuring `arr.map(({ prop }) => prop)`
          selector:
            'ArrowFunctionExpression[params.length=1][params.0.type=Identifier][body.type=MemberExpression][body.computed=false]',
          message: 'Use destructuring in callback: prefer ({ prop }) => prop over f => f.prop',
        },
      ],

      // Let TypeScript infer return types
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Forbid unnecessary type annotations
      '@typescript-eslint/no-inferrable-types': [
        'error',
        {
          ignoreParameters: false,
          ignoreProperties: false,
        },
      ],

      // Forbid .ts extensions in type-only imports side effects
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // ===== Promise Handling =====
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],

      // ===== TypeScript Import/Export =====
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-require-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '.*',
              importNamePattern: '^\\*$',
              message:
                'Namespace imports (import * as) are not allowed. Use named imports instead.',
            },
            {
              regex: '\\.js$',
              message: 'Do not use .js extension in imports. TypeScript handles module resolution.',
            },
          ],
        },
      ],

      // Variable scoping
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // ===== Import Organization =====
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'sort-imports': ['error', { ignoreDeclarationSort: true }],

      // ===== Import Hygiene =====
      'import/namespace': 'off', // Slow, TypeScript already validates imports
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],

      // ===== Unused Imports =====
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // ===== Security =====
      '@typescript-eslint/no-implied-eval': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
          allowAny: false,
          allowNullish: false,
        },
      ],
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-inner-declarations': 'error',

      // Regex DoS Prevention (eslint-plugin-regexp)
      'regexp/no-super-linear-backtracking': 'error',
      'regexp/no-dupe-characters-character-class': 'warn',
      'regexp/confusing-quantifier': 'warn',
      'regexp/optimal-quantifier-concatenation': 'warn',

      // General Security Hotspots (eslint-plugin-security)
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-child-process': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-object-injection': 'off', // Too many false positives

      // ===== Code Quality =====
      'max-params': ['error', { max: 5 }],
      complexity: ['error', { max: 20 }],

      // ===== Code Style =====
      'object-shorthand': ['error', 'always'],
      'prefer-destructuring': [
        'error',
        {
          VariableDeclarator: { array: true, object: true },
          AssignmentExpression: { array: false, object: false },
        },
        { enforceForRenamedProperties: true },
      ],

      // ===== Barrel Files =====
      'barrel-files/avoid-barrel-files': 'error',

      // ===== ESLint Comments =====
      'eslint-comments/no-use': [
        'error',
        {
          allow: ['eslint-disable-next-line', 'eslint-disable'],
        },
      ],
      'eslint-comments/require-description': [
        'error',
        {
          ignore: [],
        },
      ],
      'eslint-comments/disable-enable-pair': [
        'error',
        {
          allowWholeFile: false,
        },
      ],

      // ===== Unicorn Overrides =====
      'unicorn/filename-case': ['error', { case: 'camelCase' }],
      'unicorn/no-null': 'off', // Allow null - used by external APIs
      'unicorn/no-array-callback-reference': 'off', // Callback references are fine and readable
      'unicorn/prefer-number-properties': 'off', // isNaN is fine

      // ===== SonarJS Overrides =====
      'sonarjs/cognitive-complexity': ['error', 35],
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/no-dead-store': 'off', // False positives on loop control variables
      'sonarjs/redundant-type-aliases': 'off', // Type aliases improve readability
      'sonarjs/no-in-misuse': 'off',
      'sonarjs/todo-tag': 'off', // TODO comments are useful
      'sonarjs/deprecation': 'off', // Expensive check
      'sonarjs/aws-restricted-ip-admin-access': 'off', // Not relevant

      // Allow || for default values
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // Allow void expressions in arrow functions
      '@typescript-eslint/no-confusing-void-expression': 'off',
      // Allow unnecessary conditions (helps with optional chaining)
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    // Test files - relaxed rules
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    // Toolbar folder - uses its own tsconfig
    files: ['toolbar/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './toolbar/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // Ignore generated files and config files
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '*.config.js',
      '*.config.ts',
      'toolbar/*.config.ts',
    ],
  }
);
