import { InputHTMLAttributes, forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', invalid = false, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={
        'w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm outline-none transition ' +
        (invalid
          ? 'border-[var(--color-error)] focus:ring-2 focus:ring-[rgba(239,68,68,0.20)] '
          : 'border-[var(--color-border-default)] focus:border-[var(--wm-primary)] focus:ring-2 focus:ring-[rgba(22,155,98,0.18)] ') +
        'bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] ' +
        className
      }
      {...props}
    />
  );
});

export default Input;
