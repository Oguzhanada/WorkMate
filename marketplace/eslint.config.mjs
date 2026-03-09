import nextConfig from 'eslint-config-next/core-web-vitals';

export default [
  ...nextConfig,
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
