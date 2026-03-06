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
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {value} / {max}
          </span>
        </div>
      ) : null}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
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
