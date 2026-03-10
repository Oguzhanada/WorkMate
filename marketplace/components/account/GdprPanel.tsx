'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type DeleteState =
  | { phase: 'idle' }
  | { phase: 'confirming' }
  | { phase: 'loading' }
  | { phase: 'done'; scheduledFor: string }
  | { phase: 'error'; message: string };

export default function GdprPanel() {
  const [deleteState, setDeleteState] = useState<DeleteState>({ phase: 'idle' });
  const [confirmText, setConfirmText] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ── Data Export ───────────────────────────────────────────────────────────

  async function handleExport() {
    setExportLoading(true);
    setExportError(null);
    try {
      const res = await fetch('/api/profile/gdpr', { method: 'GET' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? 'Export failed. Please try again.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'workmate-data-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  }

  // ── Account Deletion ──────────────────────────────────────────────────────

  async function handleDeleteRequest() {
    if (confirmText !== 'DELETE') return;
    setDeleteState({ phase: 'loading' });
    try {
      const res = await fetch('/api/profile/gdpr', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (payload as { error?: string }).error ?? 'Deletion request failed. Please try again.'
        );
      }
      const typed = payload as { deletion_scheduled_for?: string };
      setDeleteState({
        phase: 'done',
        scheduledFor: typed.deletion_scheduled_for
          ? new Date(typed.deletion_scheduled_for).toLocaleDateString('en-IE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '30 days from now',
      });
    } catch (err) {
      setDeleteState({
        phase: 'error',
        message: err instanceof Error ? err.message : 'Deletion request failed. Please try again.',
      });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Export Your Data ──────────────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <h2
              className="text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
            >
              Export Your Data
            </h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              Download a copy of all personal data WorkMate holds about your account, including your
              profile, jobs, appointments, reviews, and saved providers. The file will be provided as
              a JSON document.
            </p>
          </div>

          {exportError ? (
            <p
              className="rounded-xl px-3 py-2 text-sm font-medium"
              style={{
                background: 'var(--wm-destructive-light, #fef2f2)',
                color: 'var(--wm-destructive)',
                border: '1px solid var(--wm-destructive-border, #fecaca)',
              }}
            >
              {exportError}
            </p>
          ) : null}

          <div>
            <Button
              variant="secondary"
              size="md"
              loading={exportLoading}
              onClick={handleExport}
            >
              Download My Data
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Delete Account ────────────────────────────────────────────────── */}
      <Card
        style={{ border: '1px solid var(--wm-destructive-border, #fecaca)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <h2
              className="text-base font-bold"
              style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-destructive)' }}
            >
              Delete Account
            </h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
              You can request permanent deletion of your WorkMate account and all associated personal
              data. Please read the following before proceeding:
            </p>
            <ul
              className="ml-5 mt-2 flex list-disc flex-col gap-1 text-sm"
              style={{ color: 'var(--wm-muted)' }}
            >
              <li>
                Your account will enter a <strong style={{ color: 'var(--wm-text)' }}>30-day hold</strong>{' '}
                before permanent deletion — this gives you time to change your mind.
              </li>
              <li>
                To cancel a deletion request before the 30 days elapse, contact{' '}
                <a
                  href="mailto:privacy@workmate.ie"
                  style={{ color: 'var(--wm-primary-dark)', fontWeight: 600 }}
                >
                  privacy@workmate.ie
                </a>
                .
              </li>
              <li>
                Financial transaction records are retained for 7 years after account closure to comply
                with Irish Revenue requirements — all other personal data will be removed.
              </li>
              <li>
                This action is <strong style={{ color: 'var(--wm-text)' }}>irreversible</strong> after
                the 30-day window.
              </li>
            </ul>
          </div>

          {/* Idle → show "Request Deletion" button */}
          {deleteState.phase === 'idle' ? (
            <div>
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeleteState({ phase: 'confirming' })}
              >
                Request Account Deletion
              </Button>
            </div>
          ) : null}

          {/* Confirming → show text input + confirm button */}
          {deleteState.phase === 'confirming' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--wm-text)' }}>
                Type <span style={{ fontFamily: 'monospace', color: 'var(--wm-destructive)' }}>DELETE</span>{' '}
                to confirm you understand this action cannot be undone:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                autoComplete="off"
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  borderColor: confirmText === 'DELETE' ? 'var(--wm-destructive)' : 'var(--wm-border)',
                  background: 'var(--wm-surface)',
                  color: 'var(--wm-text)',
                  outline: 'none',
                  maxWidth: '24rem',
                  width: '100%',
                }}
              />
              <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                <Button
                  variant="destructive"
                  size="md"
                  disabled={confirmText !== 'DELETE'}
                  onClick={handleDeleteRequest}
                >
                  Confirm — Delete My Account
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setDeleteState({ phase: 'idle' });
                    setConfirmText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          {/* Loading */}
          {deleteState.phase === 'loading' ? (
            <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
              Submitting deletion request...
            </p>
          ) : null}

          {/* Done */}
          {deleteState.phase === 'done' ? (
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: 'var(--wm-destructive-light, #fef2f2)',
                border: '1px solid var(--wm-destructive-border, #fecaca)',
              }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--wm-destructive)' }}>
                Deletion request received
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
                Your account and personal data will be permanently deleted on{' '}
                <strong style={{ color: 'var(--wm-text)' }}>{deleteState.scheduledFor}</strong>. To
                cancel this request before that date, email{' '}
                <a
                  href="mailto:privacy@workmate.ie"
                  style={{ color: 'var(--wm-primary-dark)', fontWeight: 600 }}
                >
                  privacy@workmate.ie
                </a>
                .
              </p>
            </div>
          ) : null}

          {/* Error */}
          {deleteState.phase === 'error' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p
                className="rounded-xl px-3 py-2 text-sm font-medium"
                style={{
                  background: 'var(--wm-destructive-light, #fef2f2)',
                  color: 'var(--wm-destructive)',
                  border: '1px solid var(--wm-destructive-border, #fecaca)',
                }}
              >
                {deleteState.message}
              </p>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeleteState({ phase: 'idle' });
                    setConfirmText('');
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
