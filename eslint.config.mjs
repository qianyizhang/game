import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typedFiles = [
  'src/**/*.{ts,tsx}',
  'packages/workshop-tools/**/*.{mjs,ts}',
  'packages/dcc-workbench/src/*.{ts,tsx}',
  'scripts/trace-visualizer/build.mjs',
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
];
