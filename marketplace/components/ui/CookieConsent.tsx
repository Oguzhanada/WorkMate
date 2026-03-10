'use client';

import {useEffect, useState, useCallback} from 'react';
import Link from 'next/link';
import {motion, AnimatePresence} from 'framer-motion';
import {Cookie, Shield, Settings} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────── */
interface CookiePreferences {
  essential: boolean;   // always true
  analytics: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'wm_cookie_consent';

function loadPreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookiePreferences;
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

/* ── Component ──────────────────────────────────────────────── */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    queueMicrotask(() => {
      const saved = loadPreferences();
      if (saved) {
        setPrefs(saved);
        setVisible(false);
      } else {
        setVisible(true);
      }
    });
  }, []);

  const acceptAll = useCallback(() => {
    const allOn: CookiePreferences = {essential: true, analytics: true, marketing: true};
    savePreferences(allOn);
    setPrefs(allOn);
    setVisible(false);
  }, []);

  const rejectAll = useCallback(() => {
    const allOff: CookiePreferences = {essential: true, analytics: false, marketing: false};
    savePreferences(allOff);
    setPrefs(allOff);
    setVisible(false);
  }, []);

  const saveCustom = useCallback(() => {
    savePreferences(prefs);
    setVisible(false);
  }, [prefs]);

  const togglePref = useCallback((key: 'analytics' | 'marketing') => {
    setPrefs(prev => ({...prev, [key]: !prev[key]}));
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{y: '100%', opacity: 0}}
          animate={{y: 0, opacity: 1}}
          exit={{y: '100%', opacity: 0}}
          transition={{type: 'spring', damping: 28, stiffness: 260}}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            padding: '16px',
            pointerEvents: 'none',
          }}
          role="dialog"
          aria-label="Cookie consent"
        >
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              background: 'var(--wm-glass)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--wm-glass-border)',
              borderRadius: 'var(--wm-radius-2xl)',
              boxShadow: 'var(--wm-shadow-2xl)',
              padding: '24px',
              pointerEvents: 'auto',
            }}
          >
            {/* ── Banner header ─────────────────────────────── */}
            <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
              <Cookie size={22} style={{color: 'var(--wm-primary)', flexShrink: 0}} />
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--wm-font-display)',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: 'var(--wm-navy)',
                }}
              >
                Cookie Preferences
              </h3>
            </div>

            {/* ── Description ───────────────────────────────── */}
            <p
              style={{
                margin: '0 0 16px',
                color: 'var(--wm-text-muted)',
                fontSize: '0.9rem',
                lineHeight: 1.55,
              }}
            >
              We use cookies to improve your experience. By continuing, you agree to our{' '}
              <Link
                href="/cookie-policy"
                style={{
                  color: 'var(--wm-primary-dark)',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                cookie policy
              </Link>
              .
            </p>

            {/* ── Preferences panel (collapsible) ───────────── */}
            <AnimatePresence>
              {showPrefs && (
                <motion.div
                  initial={{height: 0, opacity: 0}}
                  animate={{height: 'auto', opacity: 1}}
                  exit={{height: 0, opacity: 0}}
                  transition={{duration: 0.25, ease: 'easeInOut'}}
                  style={{overflow: 'hidden', marginBottom: 16}}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      padding: '16px',
                      background: 'var(--wm-surface-alt)',
                      borderRadius: 'var(--wm-radius-lg)',
                      border: '1px solid var(--wm-border-soft)',
                    }}
                  >
                    {/* Essential */}
                    <ToggleRow
                      icon={<Shield size={16} style={{color: 'var(--wm-primary)'}} />}
                      label="Essential"
                      description="Required for the site to function. Cannot be disabled."
                      checked={true}
                      disabled
                    />
                    {/* Analytics */}
                    <ToggleRow
                      icon={<Settings size={16} style={{color: 'var(--wm-amber)'}} />}
                      label="Analytics"
                      description="Help us understand how visitors use the site."
                      checked={prefs.analytics}
                      onChange={() => togglePref('analytics')}
                    />
                    {/* Marketing */}
                    <ToggleRow
                      icon={<Settings size={16} style={{color: 'var(--wm-blue)'}} />}
                      label="Marketing"
                      description="Used to deliver relevant advertisements."
                      checked={prefs.marketing}
                      onChange={() => togglePref('marketing')}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Actions ───────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              {showPrefs ? (
                <button
                  type="button"
                  onClick={saveCustom}
                  style={{
                    background: 'var(--wm-grad-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 'var(--wm-radius-md)',
                    padding: '10px 20px',
                    fontFamily: 'var(--wm-font-display)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(var(--wm-primary-rgb), 0.28)',
                    transition: 'transform var(--wm-transition), box-shadow var(--wm-transition)',
                  }}
                >
                  Save Preferences
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPrefs(true)}
                    style={{
                      background: 'transparent',
                      color: 'var(--wm-navy)',
                      border: '1px solid var(--wm-border)',
                      borderRadius: 'var(--wm-radius-md)',
                      padding: '10px 20px',
                      fontFamily: 'var(--wm-font-display)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'border-color var(--wm-transition)',
                    }}
                  >
                    <Settings size={15} />
                    Manage Preferences
                  </button>
                  <button
                    type="button"
                    onClick={rejectAll}
                    style={{
                      background: 'transparent',
                      color: 'var(--wm-navy)',
                      border: '1px solid var(--wm-border)',
                      borderRadius: 'var(--wm-radius-md)',
                      padding: '10px 20px',
                      fontFamily: 'var(--wm-font-display)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'border-color var(--wm-transition)',
                    }}
                  >
                    Reject All
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    style={{
                      background: 'var(--wm-grad-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 'var(--wm-radius-md)',
                      padding: '10px 20px',
                      fontFamily: 'var(--wm-font-display)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(var(--wm-primary-rgb), 0.28)',
                      transition: 'transform var(--wm-transition), box-shadow var(--wm-transition)',
                    }}
                  >
                    Accept All
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Toggle row sub-component ──────────────────────────────── */
function ToggleRow({
  icon,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div style={{display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1}}>
        <span style={{marginTop: 2, flexShrink: 0}}>{icon}</span>
        <div>
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.88rem',
              color: 'var(--wm-navy)',
            }}
          >
            {label}
          </span>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.8rem',
              color: 'var(--wm-text-soft)',
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label} cookies`}
        disabled={disabled}
        onClick={onChange}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          background: checked ? 'var(--wm-primary)' : 'var(--wm-border)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          flexShrink: 0,
          transition: 'background var(--wm-transition)',
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: 'var(--wm-shadow-sm)',
            transition: 'left var(--wm-transition)',
          }}
        />
      </button>
    </div>
  );
}
