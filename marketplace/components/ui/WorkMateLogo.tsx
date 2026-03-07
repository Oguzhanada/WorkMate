type Props = {
  size?: number;
  className?: string;
};

/**
 * WorkMate brand emblem — hexagonal badge with W letterform.
 * Self-contained SVG, no external font dependency.
 */
export default function WorkMateLogo({ size = 40, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="WorkMate"
      role="img"
    >
      {/* Hexagonal background — pointy-top */}
      <path
        d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
        fill="url(#wm-hex-grad)"
      />

      {/* Subtle inner hex border for depth */}
      <path
        d="M20 5.5 L33 13 L33 27 L20 34.5 L7 27 L7 13 Z"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />

      {/* W letterform — geometric polyline */}
      <polyline
        points="9,13 12.5,27 16,19 20,27 24,19 27.5,27 31,13"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Amber accent underline — brand signature */}
      <line
        x1="14"
        y1="31"
        x2="26"
        y2="31"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <defs>
        <linearGradient id="wm-hex-grad" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D4A8" />
          <stop offset="100%" stopColor="#007A5E" />
        </linearGradient>
      </defs>
    </svg>
  );
}
