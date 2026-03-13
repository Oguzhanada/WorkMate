'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type AlertBannerVariant = 'success' | 'error' | 'warning' | 'info';

type Props = {
  variant: AlertBannerVariant;
  title: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
};

const CONFIG = {
  success: {
    bg: '#f0fdf4',
    border: '#86efac',
    iconColor: '#16a34a',
    titleColor: '#14532d',
    descColor: '#166534',
    Icon: CheckCircle,
  },
  error: {
    bg: '#fef2f2',
    border: '#fca5a5',
    iconColor: '#dc2626',
    titleColor: '#7f1d1d',
    descColor: '#991b1b',
    Icon: XCircle,
  },
  warning: {
    bg: '#fffbeb',
    border: '#fcd34d',
    iconColor: '#d97706',
    titleColor: '#78350f',
    descColor: '#92400e',
    Icon: AlertTriangle,
  },
  info: {
    bg: '#eff6ff',
    border: '#93c5fd',
    iconColor: '#2563eb',
    titleColor: '#1e3a8a',
    descColor: '#1d4ed8',
    Icon: Info,
  },
} as const;

export default function AlertBanner({
  variant,
  title,
  description,
  dismissible = false,
  onDismiss,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const cfg = CONFIG[variant];

  if (dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    onDismiss?.();
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
      }}
      role="alert"
    >
      {/* Icon */}
      <div style={{ color: cfg.iconColor, flexShrink: 0, marginTop: '1px' }}>
        <cfg.Icon size={16} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: cfg.titleColor }}>
          {title}
        </p>
        {description && (
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: cfg.descColor, lineHeight: 1.5 }}>
            {description}
          </p>
        )}
      </div>

      {/* Dismiss */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          style={{
            flexShrink: 0,
            padding: '2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: cfg.iconColor,
            borderRadius: '4px',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
