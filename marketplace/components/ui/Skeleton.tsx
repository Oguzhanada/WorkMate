type SkeletonProps = {
  className?: string;
  lines?: number;
  height?: string;
};

export default function Skeleton({ className, lines = 1, height = 'h-4' }: SkeletonProps) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`rounded-lg ${height}${className ? ` ${className}` : ''}`}
          style={{ background: 'var(--wm-border)' }}
        />
      ))}
    </div>
  );
}
