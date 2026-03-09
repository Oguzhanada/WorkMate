import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantMap: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--cd-primary-500)',
    color: 'var(--cd-text-inverse)',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'var(--cd-bg-primary)',
    color: 'var(--cd-text-primary)',
    border: '1px solid var(--cd-border-default)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--cd-text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--cd-error)',
    color: 'var(--cd-text-inverse)',
    border: '1px solid transparent',
  },
};

const sizeMap: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: 32, padding: '0 12px', fontSize: 12 },
  md: { height: 40, padding: '0 16px', fontSize: 14 },
  lg: { height: 48, padding: '0 24px', fontSize: 16 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      aria-busy={loading}
      aria-disabled={disabled || loading}
      disabled={disabled || loading}
      style={{
        ...variantMap[variant],
        ...sizeMap[size],
        width: fullWidth ? '100%' : undefined,
        borderRadius: 'var(--cd-radius-md)',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: 'var(--cd-shadow-sm)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        ...style,
      }}
      {...props}
    >
      {loading ? 'Loading...' : leftIcon}
      <span>{children}</span>
      {!loading ? rightIcon : null}
    </button>
  );
}

export default Button;
