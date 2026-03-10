'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './automation-rules-panel.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

type TriggerEvent =
  | 'document_verified'
  | 'document_rejected'
  | 'job_created'
  | 'quote_received'
  | 'job_inactive'
  | 'provider_approved';

type ActionType = 'send_notification' | 'change_status' | 'create_task';

type AutomationRule = {
  id: string;
  trigger_event: TriggerEvent;
  conditions: Record<string, string>;
  action_type: ActionType;
  action_config: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
};

// ── Constants ──────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<TriggerEvent, string> = {
  document_verified: 'Document verified',
  document_rejected: 'Document rejected',
  job_created: 'Job created',
  quote_received: 'Quote received',
  job_inactive: 'Job inactive (7+ days, no quotes)',
  provider_approved: 'Provider approved',
};

const ACTION_LABELS: Record<ActionType, string> = {
  send_notification: 'Send notification',
  change_status: 'Change status',
  create_task: 'Create task',
};

const RECIPIENT_OPTIONS = [
  { value: 'all_admins', label: 'All admins' },
  { value: 'customer', label: 'Customer (from context)' },
  { value: 'provider', label: 'Provider (from context)' },
  { value: 'pro', label: 'Pro (from context)' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function conditionSummary(conditions: Record<string, string>): string {
  const entries = Object.entries(conditions);
  if (entries.length === 0) return 'Always';
  return entries.map(([k, v]) => `${k}=${v}`).join(', ');
}

function actionSummary(type: ActionType, cfg: Record<string, unknown>): string {
  if (type === 'send_notification') {
    return `Notify ${cfg.recipient ?? 'all_admins'}: "${String(cfg.message ?? '').slice(0, 40)}${String(cfg.message ?? '').length > 40 ? '…' : ''}"`;
  }
  if (type === 'change_status') {
    return `Set ${cfg.table ?? '?'}.${cfg.status_field ?? 'status'} → ${cfg.status_value ?? '?'}`;
  }
  if (type === 'create_task') {
    return `Create task: "${String(cfg.description ?? '').slice(0, 40)}"`;
  }
  return type;
}

// ── Add Rule Form ──────────────────────────────────────────────────────────

type ConditionEntry = { key: string; value: string };

type FormState = {
  trigger_event: TriggerEvent;
  conditions: ConditionEntry[];
  action_type: ActionType;
  // send_notification fields
  recipient: string;
  message: string;
  notification_type: string;
  // change_status fields
  cs_table: string;
  cs_status_field: string;
  cs_status_value: string;
  // create_task fields
  ct_description: string;
};

const DEFAULT_FORM: FormState = {
  trigger_event: 'document_verified',
  conditions: [],
  action_type: 'send_notification',
  recipient: 'all_admins',
  message: '',
  notification_type: 'automation_event',
  cs_table: 'jobs',
  cs_status_field: 'status',
  cs_status_value: '',
  ct_description: '',
};

function buildActionConfig(form: FormState): Record<string, unknown> {
  if (form.action_type === 'send_notification') {
    return {
      recipient: form.recipient,
      message: form.message,
      notification_type: form.notification_type || 'automation_event',
    };
  }
  if (form.action_type === 'change_status') {
    return {
      table: form.cs_table,
      status_field: form.cs_status_field || 'status',
      status_value: form.cs_status_value,
    };
  }
  // create_task
  return { description: form.ct_description };
}

function buildConditions(entries: ConditionEntry[]): Record<string, string> {
  return Object.fromEntries(
    entries
      .filter((e) => e.key.trim() && e.value.trim())
      .map((e) => [e.key.trim(), e.value.trim()])
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AutomationRulesPanel() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/admin/automation-rules')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); return; }
        setRules(json.rules ?? []);
      })
      .catch(() => setError('Failed to load automation rules'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) load(); });
    return () => { active = false; };
  }, [load]);

  async function toggleRule(ruleId: string, enabled: boolean) {
    const res = await fetch(`/api/admin/automation-rules/${ruleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    if (res.ok) {
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r))
      );
    }
  }

  async function deleteRule(ruleId: string) {
    if (!confirm('Delete this automation rule?')) return;
    const res = await fetch(`/api/admin/automation-rules/${ruleId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setRules((prev) => prev.filter((r) => r.id !== ruleId));
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const body = {
      trigger_event: form.trigger_event,
      conditions: buildConditions(form.conditions),
      action_type: form.action_type,
      action_config: buildActionConfig(form),
      enabled: true,
    };

    const res = await fetch('/api/admin/automation-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    setSaving(false);

    if (!res.ok || json.error) {
      setFormError(json.error ?? 'Failed to create rule');
      return;
    }

    setRules((prev) => [json.rule, ...prev]);
    setForm(DEFAULT_FORM);
    setShowForm(false);
  }

  function updateCondition(idx: number, field: 'key' | 'value', val: string) {
    setForm((prev) => {
      const conds = [...prev.conditions];
      conds[idx] = { ...conds[idx], [field]: val };
      return { ...prev, conditions: conds };
    });
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Automation Rules</h2>
          <p className={styles.sub}>
            Trigger automated actions when platform events fire.
          </p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => { setShowForm((v) => !v); setFormError(null); }}
        >
          {showForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <form className={styles.form} onSubmit={submitForm}>
          <h3 className={styles.formTitle}>New Automation Rule</h3>

          {/* Trigger */}
          <label className={styles.label}>
            Trigger event
            <select
              className={styles.select}
              value={form.trigger_event}
              onChange={(e) =>
                setForm((p) => ({ ...p, trigger_event: e.target.value as TriggerEvent }))
              }
            >
              {(Object.entries(TRIGGER_LABELS) as [TriggerEvent, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>

          {/* Conditions */}
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>
              Conditions <span className={styles.hint}>(all must match; leave empty to always fire)</span>
            </legend>
            {form.conditions.map((cond, idx) => (
              <div key={idx} className={styles.condRow}>
                <input
                  className={styles.input}
                  placeholder="key (e.g. documentType)"
                  value={cond.key}
                  onChange={(e) => updateCondition(idx, 'key', e.target.value)}
                />
                <span className={styles.eq}>=</span>
                <input
                  className={styles.input}
                  placeholder="value (e.g. id_verification)"
                  value={cond.value}
                  onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      conditions: p.conditions.filter((_, i) => i !== idx),
                    }))
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addCondBtn}
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  conditions: [...p.conditions, { key: '', value: '' }],
                }))
              }
            >
              + Add condition
            </button>
          </fieldset>

          {/* Action type */}
          <label className={styles.label}>
            Action type
            <select
              className={styles.select}
              value={form.action_type}
              onChange={(e) =>
                setForm((p) => ({ ...p, action_type: e.target.value as ActionType }))
              }
            >
              {(Object.entries(ACTION_LABELS) as [ActionType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>

          {/* Action config — dynamic by action type */}
          {form.action_type === 'send_notification' && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Notification config</legend>
              <label className={styles.label}>
                Recipient
                <select
                  className={styles.select}
                  value={form.recipient}
                  onChange={(e) => setForm((p) => ({ ...p, recipient: e.target.value }))}
                >
                  {RECIPIENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label className={styles.label}>
                Message
                <textarea
                  className={styles.textarea}
                  value={form.message}
                  placeholder="Notification message body"
                  maxLength={500}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                />
              </label>
              <label className={styles.label}>
                Notification type (slug)
                <input
                  className={styles.input}
                  value={form.notification_type}
                  placeholder="automation_event"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notification_type: e.target.value }))
                  }
                />
              </label>
            </fieldset>
          )}

          {form.action_type === 'change_status' && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Change status config</legend>
              <label className={styles.label}>
                Table
                <select
                  className={styles.select}
                  value={form.cs_table}
                  onChange={(e) => setForm((p) => ({ ...p, cs_table: e.target.value }))}
                >
                  <option value="jobs">jobs</option>
                  <option value="profiles">profiles</option>
                </select>
              </label>
              <label className={styles.label}>
                Status field
                <input
                  className={styles.input}
                  value={form.cs_status_field}
                  placeholder="status"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cs_status_field: e.target.value }))
                  }
                />
              </label>
              <label className={styles.label}>
                New status value
                <input
                  className={styles.input}
                  value={form.cs_status_value}
                  placeholder="e.g. cancelled, pending"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cs_status_value: e.target.value }))
                  }
                />
              </label>
            </fieldset>
          )}

          {form.action_type === 'create_task' && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Create task config</legend>
              <label className={styles.label}>
                Task description
                <textarea
                  className={styles.textarea}
                  value={form.ct_description}
                  placeholder="Task description (uses jobId from event context)"
                  maxLength={500}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ct_description: e.target.value }))
                  }
                />
              </label>
            </fieldset>
          )}

          {formError && <p className={styles.errorMsg}>{formError}</p>}

          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Create rule'}
          </button>
        </form>
      )}

      {/* Rules list */}
      {loading && <p className={styles.muted}>Loading rules…</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}

      {!loading && !error && rules.length === 0 && (
        <div className={styles.empty}>
          <p>No automation rules yet.</p>
          <p className={styles.sub}>Add a rule above to automate platform workflows.</p>
        </div>
      )}

      {rules.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trigger</th>
                <th>Conditions</th>
                <th>Action</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className={rule.enabled ? '' : styles.disabledRow}>
                  <td>
                    <span className={styles.triggerBadge}>
                      {TRIGGER_LABELS[rule.trigger_event]}
                    </span>
                  </td>
                  <td className={styles.condCell}>
                    {conditionSummary(rule.conditions)}
                  </td>
                  <td className={styles.actionCell}>
                    <span className={styles.actionType}>{ACTION_LABELS[rule.action_type]}</span>
                    <span className={styles.actionDetail}>
                      {actionSummary(rule.action_type, rule.action_config)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={rule.enabled ? styles.enabledBadge : styles.disabledBadge}
                      onClick={() => toggleRule(rule.id, !rule.enabled)}
                      title={rule.enabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {rule.enabled ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => deleteRule(rule.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
