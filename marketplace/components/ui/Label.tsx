import { LabelHTMLAttributes } from 'react';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export default function Label({ className = '', ...props }: LabelProps) {
  return (
    <label
      className={
        'mb-1 inline-block text-sm font-semibold text-[var(--color-text-secondary)] ' + className
      }
      {...props}
    />
  );
}
