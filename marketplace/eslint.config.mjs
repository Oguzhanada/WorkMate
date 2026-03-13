import nextConfig from 'eslint-config-next/core-web-vitals';
import tseslint from 'typescript-eslint';

export default [
  ...nextConfig,
  ...tseslint.configs.recommended,
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

      // ── FD-14: Ban Tailwind dark: utilities ─────────────────────────────────
      // Use [data-theme="dark"] CSS variable tokens (--wm-*) instead. See DR-007.
      // Covers both plain string and template literal classNames.
      'no-restricted-syntax': [
        'error',
        // dark: — string literals
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/\\bdark:/]",
          message:
            'FD-14: Tailwind dark: utilities are banned. Use --wm-* CSS tokens with [data-theme="dark"] instead. See DR-007.',
        },
        // dark: — template literals
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\bdark:/]",
          message:
            'FD-14: Tailwind dark: utilities are banned. Use --wm-* CSS tokens with [data-theme="dark"] instead. See DR-007.',
        },
        // opacity- — string literals
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/\\bopacity-[0-9]/]",
          message:
            'FD-13/FD-15: Tailwind opacity- utilities are banned on content wrappers. Use semantic --wm-text-muted/soft tokens for text, or explicit rgba() for decorative backgrounds.',
        },
        // opacity- — template literals
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\bopacity-[0-9]/]",
          message:
            'FD-13/FD-15: Tailwind opacity- utilities are banned on content wrappers. Use semantic --wm-text-muted/soft tokens for text, or explicit rgba() for decorative backgrounds.',
        },
        // text-*/N slash-opacity — string literals
        {
          selector:
            "JSXAttribute[name.name='className'] > Literal[value=/\\btext-\\S+\\/[0-9]/]",
          message:
            'FD-13: Slash-opacity on text (e.g. text-white/50) is banned. Use --wm-text-muted, --wm-text-soft, or a semantic color token instead.',
        },
        // text-*/N slash-opacity — template literals
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateElement[value.raw=/\\btext-\\S+\\/[0-9]/]",
          message:
            'FD-13: Slash-opacity on text (e.g. text-white/50) is banned. Use --wm-text-muted, --wm-text-soft, or a semantic color token instead.',
        },
      ],
    },
  },
];
