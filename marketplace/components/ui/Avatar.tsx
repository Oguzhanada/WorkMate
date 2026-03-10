type AvatarProps = {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

function initials(name?: string) {
  if (!name) return 'WM';
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
}

export default function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  if (src) {
    return <img src={src} alt={name || 'Avatar'} className={`rounded-full object-cover ${sizeMap[size]} ${className}`} />;
  }

  return (
    <div
      aria-label={name || 'Avatar'}
      className={`grid place-items-center rounded-full bg-[var(--color-primary-100)] font-bold text-[var(--color-primary-800)] ${sizeMap[size]} ${className}`}
    >
      {initials(name)}
    </div>
  );
}
