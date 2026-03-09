import { ButtonHTMLAttributes } from 'react';

type ToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  checked: boolean;
  label?: string;
};

export default function Toggle({ checked, label, className = '', ...props }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={
        'inline-flex items-center gap-2 rounded-full border px-2 py-1 text-sm ' +
        (checked
          ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-100)] text-[var(--color-primary-800)] '
          : 'border-[var(--color-border-default)] bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] ') +
        className
      }
      {...props}
    >
      <span
        className={
          'h-5 w-9 rounded-full p-0.5 transition ' +
          (checked ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-neutral-400)]')
        }
      >
        <span
          className={
            'block h-4 w-4 rounded-full bg-white transition ' + (checked ? 'translate-x-4' : 'translate-x-0')
          }
        />
      </span>
      {label ? <span>{label}</span> : null}
    </button>
  );
}
