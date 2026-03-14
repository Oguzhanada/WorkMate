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
    bg: 'var(--wm-status-success-light)',
    border: 'var(--wm-status-success-border)',
    iconColor: 'var(--wm-status-success-text)',
    titleColor: 'var(--wm-status-success-text)',
    descColor: 'var(--wm-status-success-text)',
    Icon: CheckCircle,
  },
  error: {
    bg: 'var(--wm-status-error-light)',
    border: 'var(--wm-status-error-border)',
    iconColor: 'var(--wm-status-error-text)',
    titleColor: 'var(--wm-status-error-text)',
    descColor: 'var(--wm-status-error-text)',
    Icon: XCircle,
  },
  warning: {
    bg: 'var(--wm-status-warning-light)',
    border: 'var(--wm-status-warning-border)',
    iconColor: 'var(--wm-status-warning-text)',
    titleColor: 'var(--wm-status-warning-text)',
    descColor: 'var(--wm-status-warning-text)',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'var(--wm-status-info-light)',
    border: 'var(--wm-status-info-border)',
    iconColor: 'var(--wm-status-info-text)',
    titleColor: 'var(--wm-status-info-text)',
    descColor: 'var(--wm-status-info-text)',
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
