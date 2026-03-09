import { InputHTMLAttributes } from 'react';

type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
};

export default function Radio({ label, className = '', ...props }: RadioProps) {
  return (
    <label className={'inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--color-text-secondary)] ' + className}>
      <input
        type="radio"
        className="h-4 w-4 border-[var(--color-border-default)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
        {...props}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
