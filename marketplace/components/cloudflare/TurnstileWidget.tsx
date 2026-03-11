'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile widget.
 *
 * Renders a privacy-preserving bot protection challenge.
 * The widget script is loaded lazily on first mount.
 *
 * Usage:
 *   const [cfToken, setCfToken] = useState('');
 *   <TurnstileWidget onVerify={setCfToken} onExpire={() => setCfToken('')} />
 *
 * Then include `cfToken` in your API request body as `cf_turnstile_token`.
 *
 * Env var required (public):
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY — from dash.cloudflare.com → Turnstile
 *
 * If the site key is not configured, the widget renders nothing (graceful dev fallback).
 */

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

type TurnstileOptions = {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
};

type Props = {
  /** Called when Turnstile issues a valid token. */
  onVerify: (token: string) => void;
  /** Called when the challenge expires (token is no longer valid). */
  onExpire?: () => void;
  /** Called when the widget encounters an error. */
  onError?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
};

const CF_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
const SCRIPT_ID = 'cf-turnstile-script';

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
}: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current) return; // already rendered

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      size,
      callback: onVerify,
      'expired-callback': onExpire,
      'error-callback': onError,
    });
  }, [siteKey, theme, size, onVerify, onExpire, onError]);

  useEffect(() => {
    if (!siteKey) return; // dev/no-key fallback: render nothing

    // If turnstile is already loaded, render immediately.
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Queue the render for when the script finishes loading.
    window.onTurnstileLoad = renderWidget;

    // Inject the script once (idempotent).
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = CF_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, renderWidget]);

  if (!siteKey) return null;

  return (
    <div
      ref={containerRef}
      style={{ margin: '8px 0' }}
      aria-label="Security challenge"
    />
  );
}
