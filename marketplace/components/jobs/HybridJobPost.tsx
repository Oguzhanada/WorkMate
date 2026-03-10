'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, FileText, Target, Zap } from 'lucide-react';
import type { JobMode } from '@/lib/types/airtasker';
import styles from './hybrid-job-post.module.css';

type JobModeOption = {
  id: JobMode;
  icon: React.ReactNode;
  title: string;
  description: string;
};

const JOB_MODES: JobModeOption[] = [
  {
    id: 'get_quotes',
    icon: <FileText className={styles.modeIconSvg} />,
    title: 'Get Quotes',
    description: 'Receive unlimited quotes and compare at your pace. Best for: complex work and detailed comparison.',
  },
  {
    id: 'quick_hire',
    icon: <Zap className={styles.modeIconSvg} />,
    title: 'Quick Hire',
    description: 'Urgent flag + limited to 5 quotes for fast decisions. Best for: flexible budget, fast turnaround.',
  },
  {
    id: 'direct_request',
    icon: <Target className={styles.modeIconSvg} />,
    title: 'Direct Request',
    description: 'Send to a specific provider you already know. Only they can respond.',
  },
];

type HybridJobPostProps = {
  selectedMode?: JobMode;
  onModeSelect: (mode: JobMode) => void;
  collapsed?: boolean;
};

export default function HybridJobPost({ selectedMode, onModeSelect, collapsed = false }: HybridJobPostProps) {
  const [expanded, setExpanded] = useState(!collapsed);

  if (!expanded) {
    const current = JOB_MODES.find((m) => m.id === selectedMode) ?? JOB_MODES[0];
    return (
      <button
        type="button"
        className={styles.collapsedToggle}
        onClick={() => setExpanded(true)}
      >
        <span className={styles.collapsedIcon}>{current.icon}</span>
        <span className={styles.collapsedLabel}>
          Posting as <strong>{current.title}</strong>
        </span>
        <span className={styles.collapsedChange}>Change</span>
      </button>
    );
  }

  return (
    <div className={styles.wrapper} role="radiogroup" aria-label="Job posting mode">
      <p className={styles.label}>How would you like to hire?</p>
      <div className={styles.grid}>
        {JOB_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <motion.button
              key={mode.id}
              type="button"
              onClick={() => {
                onModeSelect(mode.id);
                if (collapsed) setExpanded(false);
              }}
              whileTap={{ scale: 0.98 }}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
              role="radio"
              aria-checked={isSelected}
            >
              <span className={`${styles.radio} ${isSelected ? styles.radioActive : ''}`}>
                {isSelected ? <Check className={styles.radioCheck} /> : null}
              </span>
              <span className={styles.modeIcon}>{mode.icon}</span>
              <span className={styles.cardBody}>
                <span className={styles.cardTitle}>{mode.title}</span>
                <span className={styles.cardDescription}>{mode.description}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
