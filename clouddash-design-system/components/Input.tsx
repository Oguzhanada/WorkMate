import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, style, ...props }: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {label ? (
        <label htmlFor={inputId} style={{ fontSize: 14, fontWeight: 600, color: 'var(--cd-text-secondary)' }}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        style={{
          height: 40,
          borderRadius: 'var(--cd-radius-md)',
          border: `1px solid ${error ? 'var(--cd-error)' : 'var(--cd-border-default)'}`,
          padding: '0 12px',
          fontSize: 14,
          color: 'var(--cd-text-primary)',
          background: 'var(--cd-bg-primary)',
          outline: 'none',
          ...style,
        }}
        {...props}
      />
      {error ? <span style={{ color: 'var(--cd-error)', fontSize: 12 }}>{error}</span> : null}
    </div>
  );
}

export default Input;
