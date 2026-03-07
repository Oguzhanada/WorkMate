import Link from 'next/link';
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'navy';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

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
    'text-white border border-transparent ' +
    'bg-[var(--wm-primary)] ' +
    'shadow-[0_4px_14px_rgba(0,184,148,0.35)] ' +
    'hover:bg-[var(--wm-primary-dark)] hover:shadow-[0_6px_20px_rgba(0,184,148,0.45)] hover:-translate-y-px ' +
    'active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,184,148,0.30)]',
  secondary:
    'bg-white dark:bg-zinc-900 text-[var(--wm-text)] dark:text-zinc-100 ' +
    'border border-[var(--wm-border)] dark:border-zinc-700 ' +
    'shadow-[var(--wm-shadow-sm)] ' +
    'hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)] hover:shadow-[var(--wm-shadow-md)] hover:-translate-y-px ' +
    'active:translate-y-0',
  ghost:
    'bg-transparent text-[var(--wm-muted)] dark:text-zinc-300 border border-transparent ' +
    'hover:bg-[var(--wm-primary-light)] hover:text-[var(--wm-primary-dark)] ' +
    'active:bg-[var(--wm-primary-light)]',
  outline:
    'bg-transparent text-[var(--wm-primary)] border border-[var(--wm-primary)] ' +
    'hover:bg-[var(--wm-primary)] hover:text-white hover:shadow-[0_4px_14px_rgba(0,184,148,0.30)] hover:-translate-y-px ' +
    'active:translate-y-0',
  destructive:
    'text-white border border-transparent ' +
    'bg-[var(--wm-destructive)] ' +
    'shadow-[0_4px_14px_rgba(220,38,38,0.28)] ' +
    'hover:bg-[var(--wm-destructive-dark)] hover:shadow-[0_6px_20px_rgba(220,38,38,0.38)] hover:-translate-y-px ' +
    'active:translate-y-0',
  navy:
    'text-white border border-transparent ' +
    'bg-[var(--wm-navy)] ' +
    'shadow-[0_4px_14px_rgba(12,27,51,0.30)] ' +
    'hover:bg-[var(--wm-navy-mid)] hover:shadow-[0_6px_20px_rgba(12,27,51,0.40)] hover:-translate-y-px ' +
    'active:translate-y-0',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  'px-3 py-1.5 text-xs gap-1.5',
  md:  'px-4 py-2.5 text-sm gap-2',
  lg:  'px-6 py-3 text-sm gap-2',
  xl:  'px-8 py-4 text-base gap-2.5',
};

const base =
  'inline-flex items-center justify-center font-semibold rounded-xl ' +
  'font-[var(--wm-font-sans)] transition-all duration-200 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
  'cursor-pointer select-none';

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
