import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // Warn on console.log left in production code (console.error/warn allowed)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Catch unused variables — prefix with _ to suppress
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Prefer const
      'prefer-const': 'error',
      // No duplicate imports
      'no-duplicate-imports': 'error',
    },
  },
];
