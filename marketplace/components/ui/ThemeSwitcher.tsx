'use client';

import { useEffect, useState } from 'react';

type ThemeId = 'light' | 'b';

const themes: { id: ThemeId; label: string; color: string }[] = [
  { id: 'light', label: 'Ireland', color: '#169B62' },
  { id: 'b',     label: 'OnTask',  color: '#2563EB' },
];

export default function ThemeSwitcher() {
  const [active, setActive] = useState<ThemeId>('light');
  const [open, setOpen] = useState(false);

  // Read saved theme from localStorage after mount (SSR-safe)
  useEffect(() => {
    const saved = (localStorage.getItem('wm-theme') as ThemeId) ?? 'light';
    document.documentElement.setAttribute('data-theme', saved);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(saved);
  }, []);

  function apply(id: ThemeId) {
    setActive(id);
    setOpen(false);
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('wm-theme', id);
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Options panel */}
      {open && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '140px',
          }}
        >
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 2px', margin: 0 }}>
            Tema seç
          </p>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => apply(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                background: active === t.id ? '#f1f5f9' : 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: active === t.id ? 600 : 400,
                color: '#0f172a',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: t.color,
                  flexShrink: 0,
                  outline: active === t.id ? `2px solid ${t.color}` : 'none',
                  outlineOffset: '2px',
                }}
              />
              {t.label}
              {active === t.id && (
                <span style={{ marginLeft: 'auto', color: t.color, fontSize: '11px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Toggle button — border colour shows active theme (debug indicator) */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={`Tema: ${active === 'b' ? 'OnTask' : 'Ireland'}`}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: `3px solid ${active === 'b' ? '#2563EB' : '#169B62'}`,
          background: '#fff',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          transition: 'transform 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        🎨
      </button>
    </div>
  );
}
