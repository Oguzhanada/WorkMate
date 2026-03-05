'use client';

import { useEffect, useState } from 'react';
import styles from './dashboard.module.css';

const IRELAND_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow', 'Ireland-wide',
];

type TaskAlert = {
  id: string;
  keywords: string[];
  counties: string[];
  budget_min: number | null;
  enabled: boolean;
};

export default function TaskAlertsPanel() {
  const [alert, setAlert] = useState<TaskAlert | null>(null);
  const [keywords, setKeywords] = useState('');
  const [counties, setCounties] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetch('/api/task-alerts')
      .then((r) => r.json())
      .then(({ alert: existing }: { alert: TaskAlert | null }) => {
        if (existing) {
          setAlert(existing);
          setKeywords((existing.keywords ?? []).join(', '));
          setCounties(existing.counties ?? []);
          setBudgetMin(existing.budget_min ? String(existing.budget_min) : '');
          setEnabled(existing.enabled ?? true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleCounty = (county: string) => {
    setCounties((current) =>
      current.includes(county) ? current.filter((c) => c !== county) : [...current, county]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback('');

    const keywordList = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const response = await fetch('/api/task-alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: keywordList,
        counties,
        budget_min: budgetMin ? Number(budgetMin) : null,
        enabled,
      }),
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Could not save alert preferences.');
      return;
    }

    setAlert(payload.alert);
    setFeedback('Task alert preferences saved.');
  };

  const handleDelete = async () => {
    setSaving(true);
    await fetch('/api/task-alerts', { method: 'DELETE' });
    setAlert(null);
    setKeywords('');
    setCounties([]);
    setBudgetMin('');
    setEnabled(true);
    setSaving(false);
    setFeedback('Task alert removed.');
  };

  if (loading) return null;

  return (
    <div className={styles.card}>
      <p className={styles.title}>Job Alerts</p>
      <p className={styles.meta}>
        Get notified when a new job matches your preferences. You receive an in-app notification for each match.
      </p>

      <div className={styles.stack}>
        <label className={styles.meta}>
          Keywords (comma-separated, e.g. painting, tiling)
        </label>
        <input
          className={styles.input}
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g. plumbing, boiler, bathroom"
        />

        <label className={styles.meta}>Minimum budget (EUR, optional)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={budgetMin}
          onChange={(e) => setBudgetMin(e.target.value)}
          placeholder="e.g. 200"
        />

        <label className={styles.meta}>Counties (leave empty for Ireland-wide)</label>
        <div className={styles.countyGrid}>
          {IRELAND_COUNTIES.map((county) => (
            <label key={county} className={styles.countyLabel}>
              <input
                type="checkbox"
                checked={counties.includes(county)}
                onChange={() => toggleCounty(county)}
              />
              {' '}{county}
            </label>
          ))}
        </div>

        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          {' '}Alerts enabled
        </label>

        {feedback ? <p className={styles.feedback}>{feedback}</p> : null}

        <div className={styles.buttons}>
          <button className={styles.primary} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
          {alert ? (
            <button className={styles.danger} onClick={handleDelete} disabled={saving}>
              Remove alert
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
