type Props = {
  size?: number;
  className?: string;
};

export default function WorkMateLogo({ size = 40, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WorkMate"
      role="img"
    >
      <rect x="1" y="1" width="34" height="34" rx="12" fill="url(#wm-logo-grad)" />
      <path
        d="M8 12.5L10.6 24L14 17L18 24L22 17L25.4 24L28 12.5"
        stroke="white"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="wm-logo-grad" x1="1" y1="1" x2="35" y2="35" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}
