import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const typedFiles = [
  'src/**/*.{ts,tsx}',
  'packages/diablo2/**/*.{ts,tsx}',
  'tests/**/*.ts',
  '*.config.ts',
  'packages/workshop-tools/**/*.{mjs,ts,tsx}',
  'packages/dcc-workbench/src/*.{ts,tsx}',
  'packages/dcc-workbench/*.{ts,mjs}',
  'packages/dcc-workbench/evaluation/*.ts',
  'packages/dcc-workbench/subjects/canid/*.ts',
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
    files: [
      'src/**/*.{ts,tsx}',
      'packages/dcc-workbench/src/**/*.{ts,tsx}',
      'packages/diablo2/src/ui/**/*.{ts,tsx}',
    ],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: [
      'packages/dcc-workbench/*.{ts,mjs}',
      'packages/dcc-workbench/evaluation/*.ts',
      'packages/dcc-workbench/subjects/canid/*.ts',
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
        project: './packages/dcc-workbench/tsconfig.tools.json',
      },
    },
  },
];
