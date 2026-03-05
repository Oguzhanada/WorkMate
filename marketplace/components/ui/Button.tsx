import Link from 'next/link';
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md';

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--wm-primary)] text-white border border-transparent hover:bg-[var(--wm-primary-dark)] shadow-[0_10px_24px_rgba(22,163,74,0.35)]',
  secondary:
    'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
  ghost:
    'bg-transparent text-zinc-700 dark:text-zinc-200 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
};

const base =
  'inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

function compose(className?: string, variant: ButtonVariant = 'secondary', size: ButtonSize = 'md') {
  return `${base} ${variantClasses[variant]} ${sizeClasses[size]}${className ? ` ${className}` : ''}`;
}

export default function Button({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className,
}: ButtonProps) {
  const classes = compose(className, variant, size);
  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
