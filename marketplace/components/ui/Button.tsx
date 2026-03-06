import Link from 'next/link';
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--wm-primary)] text-white border border-transparent hover:bg-[var(--wm-primary-dark)] shadow-[0_10px_24px_rgba(0,184,148,0.30)]',
  secondary:
    'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
  ghost:
    'bg-transparent text-zinc-700 dark:text-zinc-200 border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800',
  outline:
    'bg-transparent text-[var(--wm-primary)] border border-[var(--wm-primary)] hover:bg-[var(--wm-primary)] hover:text-white',
  destructive:
    'bg-[var(--wm-destructive)] text-white border border-transparent hover:bg-[var(--wm-destructive-dark)] shadow-[0_10px_24px_rgba(220,38,38,0.25)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

function compose(className?: string, variant: ButtonVariant = 'secondary', size: ButtonSize = 'md'): string {
  return `${base} ${variantClasses[variant]} ${sizeClasses[size]}${className ? ` ${className}` : ''}`;
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function Button({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
}: ButtonProps) {
  const classes = compose(className, variant, size);
  const isDisabled = disabled || loading;

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={isDisabled}>
        {loading ? <Spinner /> : null}
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={isDisabled} className={classes} aria-busy={loading}>
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
