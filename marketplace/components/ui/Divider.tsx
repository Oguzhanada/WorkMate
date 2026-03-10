type DividerProps = {
  className?: string;
  label?: string;
};

export default function Divider({ className = '', label }: DividerProps) {
  if (!label) {
    return <hr className={`border-0 border-t border-[var(--color-border-default)] ${className}`} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-[var(--color-border-default)]" />
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</span>
      <span className="h-px flex-1 bg-[var(--color-border-default)]" />
    </div>
  );
}
