'use client';

import { useEffect, useState } from 'react';
import styles from './dashboard.module.css';
import Button from '@/components/ui/Button';

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
  categories: string[];
  counties: string[];
  budget_min: number | null;
  enabled: boolean;
};

type TaskAlertSuggestion = {
  categories: { id: string; name: string }[];
  counties: string[];
};

export default function TaskAlertsPanel() {
  const [alert, setAlert] = useState<TaskAlert | null>(null);
  const [suggestion, setSuggestion] = useState<TaskAlertSuggestion | null>(null);
  const [keywords, setKeywords] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [counties, setCounties] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestFeedback, setAiSuggestFeedback] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/task-alerts');
      const { alert: existing } = (await response.json()) as { alert: TaskAlert | null };
      if (existing) {
        setAlert(existing);
        setKeywords((existing.keywords ?? []).join(', '));
        setCategoryIds(existing.categories ?? []);
        setCounties(existing.counties ?? []);
        setBudgetMin(existing.budget_min ? String(existing.budget_min) : '');
        setEnabled(existing.enabled ?? true);
        setLoading(false);
        return;
      }

      const suggestionResponse = await fetch('/api/task-alerts/suggest');
      if (suggestionResponse.ok) {
        const payload = (await suggestionResponse.json()) as { suggestion: TaskAlertSuggestion | null };
        setSuggestion(payload.suggestion);
      }
      setLoading(false);
    };

    load().catch(() => {
      setLoading(false);
      setFeedback('Could not load task alert preferences.');
    });
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
        categories: categoryIds,
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
    setCategoryIds(payload.alert.categories ?? []);
    setFeedback('Task alert preferences saved.');
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    setFeedback('');

    const response = await fetch('/api/task-alerts/suggest', { method: 'POST' });
    const payload = await response.json();
    setSuggesting(false);

    if (!response.ok) {
      setFeedback(payload.error || 'Could not create suggested alert.');
      return;
    }

    const createdAlert = payload.alert as TaskAlert;
    setAlert(createdAlert);
    setKeywords((createdAlert.keywords ?? []).join(', '));
    setCategoryIds(createdAlert.categories ?? []);
    setCounties(createdAlert.counties ?? []);
    setBudgetMin(createdAlert.budget_min ? String(createdAlert.budget_min) : '');
    setEnabled(createdAlert.enabled ?? true);
    setSuggestion(null);
    setFeedback('Suggested alert created from your provider services.');
  };

  const handleDelete = async () => {
    setSaving(true);
    await fetch('/api/task-alerts', { method: 'DELETE' });
    setAlert(null);
    setKeywords('');
    setCategoryIds([]);
    setCounties([]);
    setBudgetMin('');
    setEnabled(true);
    setSaving(false);
    const suggestionResponse = await fetch('/api/task-alerts/suggest');
    if (suggestionResponse.ok) {
      const payload = (await suggestionResponse.json()) as { suggestion: TaskAlertSuggestion | null };
      setSuggestion(payload.suggestion);
    }
    setFeedback('Task alert removed.');
  };

  if (loading) return null;

  return (
    <div className={styles.card}>
      <p className={styles.title}>Job Alerts</p>
      <p className={styles.meta}>
        Get notified when a new job matches your preferences. You receive an in-app notification for each match.
      </p>
      {!alert && suggestion ? (
        <div className={styles.aiSuggestionCard}>
          <div className={styles.aiSuggestionHeader}>
            <span aria-hidden="true">✨</span>
            <span>AI Suggested Alert</span>
            <span className={styles.aiSuggestionBadge}>Smart Match</span>
          </div>
          <p className={styles.meta}>
            Based on your registered services and service areas, WorkMate can auto-create a job alert for you.
          </p>
          {suggestion.categories.length > 0 ? (
            <div>
              <p className={styles.aiSuggestionLabel}>Categories</p>
              <div className={styles.aiPills}>
                {suggestion.categories.map((cat) => (
                  <span key={cat.id} className={styles.aiPill}>{cat.name}</span>
                ))}
              </div>
            </div>
          ) : null}
          {suggestion.counties.length > 0 ? (
            <div>
              <p className={styles.aiSuggestionLabel}>Service areas</p>
              <div className={styles.aiPills}>
                {suggestion.counties.map((county) => (
                  <span key={county} className={styles.aiPillCounty}>{county}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.meta}>Coverage: <strong>Ireland-wide</strong></p>
          )}
          <div className={styles.buttons}>
            <button className={styles.primary} onClick={handleSuggest} disabled={suggesting || saving}>
              {suggesting ? 'Creating alert...' : 'Apply suggestions'}
            </button>
          </div>
        </div>
      ) : null}

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
