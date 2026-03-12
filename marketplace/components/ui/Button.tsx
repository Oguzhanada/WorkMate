import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'navy';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type ButtonProps = {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick' | 'disabled' | 'className' | 'children'>;

const variantClasses: Record<ButtonVariant, string> = {
  // Irish Emerald — primary CTA
  primary:
    'text-white border border-transparent ' +
    'bg-[var(--wm-primary)] ' +
    'shadow-[0_4px_14px_rgba(22,155,98,0.30)] ' +
    'hover:bg-[var(--wm-primary-dark)] hover:shadow-[0_8px_22px_rgba(22,155,98,0.38)] hover:-translate-y-0.5 ' +
    'active:translate-y-0 active:shadow-[0_2px_8px_rgba(22,155,98,0.22)]',

  // White card with navy text — secondary action
  secondary:
    'bg-[var(--wm-surface)] text-[var(--color-text-primary)] ' +
    'border border-[var(--wm-border)] ' +
    'shadow-[var(--wm-shadow-sm)] ' +
    'hover:border-[var(--wm-primary)] hover:text-[var(--wm-primary)] ' +
    'hover:shadow-[var(--wm-shadow-md)] hover:-translate-y-0.5 ' +
    'active:translate-y-0',

  // Minimal — for toolbars and inline actions
  ghost:
    'bg-transparent text-[var(--wm-text-soft)] border border-transparent ' +
    'hover:bg-[var(--wm-primary-light)] hover:text-[var(--wm-primary-dark)] ' +
    'active:bg-[var(--wm-primary-faint)]',

  // Bordered emerald — for secondary emphasis
  outline:
    'bg-transparent text-[var(--wm-primary)] ' +
    'border-2 border-[var(--wm-primary)] ' +
    'hover:bg-[var(--wm-primary)] hover:text-white ' +
    'hover:shadow-[0_4px_14px_rgba(22,155,98,0.28)] hover:-translate-y-0.5 ' +
    'active:translate-y-0',

  // Danger — destructive actions
  destructive:
    'text-white border border-transparent ' +
    'bg-[var(--wm-destructive)] ' +
    'shadow-[0_4px_14px_rgba(239,68,68,0.28)] ' +
    'hover:bg-[var(--wm-destructive-dark)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.36)] hover:-translate-y-0.5 ' +
    'active:translate-y-0',

  // Navy — trust/authority actions (sign in, admin)
  navy:
    'text-white border border-transparent ' +
    'bg-[var(--wm-navy)] ' +
    'shadow-[0_4px_14px_rgba(27,42,74,0.30)] ' +
    'hover:bg-[var(--wm-navy-mid)] hover:shadow-[0_8px_22px_rgba(27,42,74,0.38)] hover:-translate-y-0.5 ' +
    'active:translate-y-0',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  'px-3 py-2 text-xs gap-1.5',
  md:  'px-4 py-2.5 text-sm gap-2',
  lg:  'px-6 py-3 text-base gap-2',
  xl:  'px-8 py-4 text-lg gap-2.5',
};

const base =
  'inline-flex items-center justify-center font-semibold rounded-2xl ' +
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
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  external = false,
  ...rest
}: ButtonProps) {
  const classes = compose(`${fullWidth ? 'w-full' : ''} ${className ?? ''}`, variant, size);
  const isDisabled = disabled || loading;

  const inner = (
    <>
      {loading ? <Spinner /> : null}
      {!loading ? leftIcon : null}
      {children}
      {!loading ? rightIcon : null}
    </>
  );

  if (href && external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" aria-disabled={isDisabled}>
        {inner}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes} aria-disabled={isDisabled}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={isDisabled} className={classes} aria-busy={loading} {...rest}>
      {inner}
    </button>
  );
}
