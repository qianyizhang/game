import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const typedFiles = [
  'src/**/*.{ts,tsx}',
  'packages/session-review/**/*.{ts,tsx}',
  'tests/**/*.ts',
  '*.config.ts',
  'packages/workshop-tools/**/*.{mjs,ts,tsx}',
  'packages/dcc-workbench/src/*.{ts,tsx}',
  'packages/dcc-workbench/*.{ts,mjs}',
];

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'test-results/**', '.agents/**', '.work/**'],
  },
  {
    files: ['packages/workshop-tools/*.mjs', 'eslint.config.mjs'],
    languageOptions: { globals: globals.node },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({ ...config, files: typedFiles })),
  {
    files: typedFiles,
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    files: ['packages/session-review/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['packages/session-review/src/model/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-dom',
                'react-dom/*',
                '**/app/**',
                '**/actions/**',
                '**/conversation/**',
                '**/records/**',
                '**/curation/**',
                '**/*.tsx',
              ],
              message:
                'The review model owns data and classification; presentation depends on it, not the reverse.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/dcc-workbench/*.{ts,mjs}'],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './packages/dcc-workbench/tsconfig.tools.json',
      },
    },
  },
];
