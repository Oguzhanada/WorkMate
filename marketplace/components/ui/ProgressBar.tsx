type ProgressBarProps = {
  value: number;
  max: number;
  label?: string;
  className?: string;
};

export default function ProgressBar({ value, max, label, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={className}>
      {label ? (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: 'var(--wm-text-default)' }}>{label}</span>
          <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>
            {value} / {max}
          </span>
        </div>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: 'var(--wm-border)' }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className="h-full rounded-full bg-[var(--wm-primary)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
