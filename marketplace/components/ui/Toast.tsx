'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type Toast = {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  toast: (opts: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
};

// ─── Context ───────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Variant config ────────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
  success: {
    bg: 'var(--wm-status-success-light)',
    border: 'var(--wm-status-success-border)',
    iconColor: 'var(--wm-status-success-text)',
    Icon: CheckCircle,
  },
  error: {
    bg: 'var(--wm-status-error-light)',
    border: 'var(--wm-status-error-border)',
    iconColor: 'var(--wm-status-error-text)',
    Icon: XCircle,
  },
  warning: {
    bg: 'var(--wm-status-warning-light)',
    border: 'var(--wm-status-warning-border)',
    iconColor: 'var(--wm-status-warning-text)',
    Icon: AlertTriangle,
  },
  info: {
    bg: 'var(--wm-status-info-light)',
    border: 'var(--wm-status-info-border)',
    iconColor: 'var(--wm-status-info-text)',
    Icon: Info,
  },
} as const;

// ─── Single Toast Item ─────────────────────────────────────────────────────────

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const cfg = VARIANT_CONFIG[t.variant];

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timeout);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss(t.id), 300);
  }, [t.id, onDismiss]);

  useEffect(() => {
    const duration = t.duration ?? 4500;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [t.duration, dismiss]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        minWidth: '280px',
        maxWidth: '380px',
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.32s ease',
        willChange: 'transform, opacity',
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div style={{ color: cfg.iconColor, flexShrink: 0, marginTop: '1px' }}>
        <cfg.Icon size={16} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--wm-neutral-900)' }}>
          {t.title}
        </p>
        {t.description && (
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--wm-neutral-500)', lineHeight: 1.4 }}>
            {t.description}
          </p>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        style={{
          flexShrink: 0,
          padding: '2px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--wm-neutral-400)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          lineHeight: 1,
        }}
        aria-label="Dismiss notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Toast Container ───────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={t} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}
