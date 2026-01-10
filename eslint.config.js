// @ts-check
import eslint from '@eslint/js';
import barrelFiles from 'eslint-plugin-barrel-files';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    plugins: {
      'barrel-files': barrelFiles,
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
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
          selector: 'TSAsExpression:not([typeAnnotation.typeName.name="const"])',
          message:
            'Type assertions (as Type) are disallowed. Use type guards/predicates instead. ' +
            'Exception: `as const` is allowed for literal narrowing.',
        },
        {
          selector: 'TSTypeAssertion',
          message:
            'Angle-bracket type assertions (<Type>expr) are disallowed. Use type guards/predicates instead.',
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

      // ===== Unused Variables =====
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
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

      // ===== Code Quality =====
      'max-params': ['error', { max: 5 }],
      complexity: 'off',

      // ===== Code Style =====
      'object-shorthand': ['error', 'always'],
      'id-length': ['error', { min: 3, exceptions: ['id', 'x', 'y', 'el', 'vw', 'vh'] }],
      'prefer-destructuring': [
        'error',
        {
          array: false,
          object: true,
        },
      ],

      // ===== Barrel Files =====
      'barrel-files/avoid-barrel-files': 'error',

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
