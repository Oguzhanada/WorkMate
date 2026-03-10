import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./components/**/*.{ts,tsx}', './stories/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--cd-primary-50)',
          100: 'var(--cd-primary-100)',
          200: 'var(--cd-primary-200)',
          300: 'var(--cd-primary-300)',
          400: 'var(--cd-primary-400)',
          500: 'var(--cd-primary-500)',
          600: 'var(--cd-primary-600)',
          700: 'var(--cd-primary-700)',
          800: 'var(--cd-primary-800)',
          900: 'var(--cd-primary-900)',
        },
        neutral: {
          0: 'var(--cd-neutral-0)',
          50: 'var(--cd-neutral-50)',
          100: 'var(--cd-neutral-100)',
          200: 'var(--cd-neutral-200)',
          300: 'var(--cd-neutral-300)',
          400: 'var(--cd-neutral-400)',
          500: 'var(--cd-neutral-500)',
          600: 'var(--cd-neutral-600)',
          700: 'var(--cd-neutral-700)',
          800: 'var(--cd-neutral-800)',
          900: 'var(--cd-neutral-900)',
        },
        semantic: {
          success: 'var(--cd-success)',
          warning: 'var(--cd-warning)',
          error: 'var(--cd-error)',
          info: 'var(--cd-info)',
        },
        bg: {
          primary: 'var(--cd-bg-primary)',
          secondary: 'var(--cd-bg-secondary)',
        },
        text: {
          primary: 'var(--cd-text-primary)',
          secondary: 'var(--cd-text-secondary)',
          muted: 'var(--cd-text-muted)',
          inverse: 'var(--cd-text-inverse)',
        },
        border: {
          default: 'var(--cd-border-default)',
          strong: 'var(--cd-border-strong)',
          focus: 'var(--cd-border-focus)',
        },
      },
      spacing: {
        0: 'var(--cd-space-0)',
        1: 'var(--cd-space-1)',
        2: 'var(--cd-space-2)',
        3: 'var(--cd-space-3)',
        4: 'var(--cd-space-4)',
        6: 'var(--cd-space-6)',
        8: 'var(--cd-space-8)',
        12: 'var(--cd-space-12)',
        16: 'var(--cd-space-16)',
      },
      borderRadius: {
        none: 'var(--cd-radius-none)',
        sm: 'var(--cd-radius-sm)',
        md: 'var(--cd-radius-md)',
        lg: 'var(--cd-radius-lg)',
        full: 'var(--cd-radius-full)',
      },
      boxShadow: {
        sm: 'var(--cd-shadow-sm)',
        md: 'var(--cd-shadow-md)',
        lg: 'var(--cd-shadow-lg)',
        xl: 'var(--cd-shadow-xl)',
      },
      fontFamily: {
        heading: ['var(--cd-font-heading)'],
        body: ['var(--cd-font-body)'],
        mono: ['var(--cd-font-mono)'],
      },
      fontSize: {
        xs: 'var(--cd-font-size-xs)',
        sm: 'var(--cd-font-size-sm)',
        base: 'var(--cd-font-size-md)',
        lg: 'var(--cd-font-size-lg)',
        xl: 'var(--cd-font-size-xl)',
        '2xl': 'var(--cd-font-size-2xl)',
        '3xl': 'var(--cd-font-size-3xl)',
        '4xl': 'var(--cd-font-size-4xl)',
      },
    },
  },
  plugins: [],
};

export default config;
