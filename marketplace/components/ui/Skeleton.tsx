type SkeletonProps = {
  className?: string;
  lines?: number;
  height?: string;
};

export default function Skeleton({ className, lines = 1, height = 'h-4' }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-shimmer rounded-lg ${height}${className ? ` ${className}` : ''}`}
        />
      ))}
    </div>
  );
}
