import { ReactNode } from 'react';
import Label from '@/components/ui/Label';

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-[var(--color-error)]">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
      {error ? <p className="text-xs text-[var(--color-error)]">{error}</p> : null}
    </div>
  );
}
