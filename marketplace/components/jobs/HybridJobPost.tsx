'use client';

import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, FileText, Target, Zap } from 'lucide-react';
import type { JobMode } from '@/lib/types/airtasker';
import styles from './hybrid-job-post.module.css';

type JobModeOption = {
  id: JobMode;
  icon: ReactNode;
  title: string;
  description: string;
  bestFor: string;
  colorClass: string;
};

const JOB_MODES: JobModeOption[] = [
  {
    id: 'quick_hire',
    icon: <Zap className={styles.modeIconSvg} />,
    title: 'Quick Hire',
    description: 'Post fast and compare offers from available providers.',
    bestFor: 'Flexible budget and fast turnaround',
    colorClass: styles.modeIconQuick,
  },
  {
    id: 'direct_request',
    icon: <Target className={styles.modeIconSvg} />,
    title: 'Direct Request',
    description: 'Choose a specific provider and request a direct booking.',
    bestFor: 'Known provider and urgent timeline',
    colorClass: styles.modeIconDirect,
  },
  {
    id: 'get_quotes',
    icon: <FileText className={styles.modeIconSvg} />,
    title: 'Get Quotes',
    description: 'Share project details and receive structured quotes.',
    bestFor: 'Complex work and detailed comparison',
    colorClass: styles.modeIconQuotes,
  },
];

type HybridJobPostProps = {
  selectedMode?: JobMode;
  onModeSelect: (mode: JobMode) => void;
};

export default function HybridJobPost({ selectedMode, onModeSelect }: HybridJobPostProps) {
  const [hoveredMode, setHoveredMode] = useState<JobMode | null>(null);

  return (
    <section className={styles.wrapper} aria-label="Job posting mode selector">
      <header className={styles.header}>
        <h2 className={styles.title}>Choose your posting mode</h2>
        <p className={styles.subtitle}>Select the flow that best matches your hiring intent.</p>
      </header>

      <div className={styles.grid}>
        {JOB_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isHovered = hoveredMode === mode.id;

          return (
            <motion.button
              key={mode.id}
              type="button"
              onHoverStart={() => setHoveredMode(mode.id)}
              onHoverEnd={() => setHoveredMode(null)}
              onClick={() => onModeSelect(mode.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.995 }}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
            >
              <div className={`${styles.modeIcon} ${mode.colorClass}`}>{mode.icon}</div>
              <h3 className={styles.cardTitle}>{mode.title}</h3>
              <p className={styles.cardDescription}>{mode.description}</p>
              <p className={styles.cardHint}>Best for: {mode.bestFor}</p>

              <AnimatePresence>
                {isSelected ? (
                  <motion.span
                    key="selected"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className={styles.selectedBadge}
                  >
                    <Check className={styles.selectedBadgeIcon} />
                  </motion.span>
                ) : null}
              </AnimatePresence>

              <AnimatePresence>
                {isHovered || isSelected ? (
                  <motion.span
                    key="arrow"
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    className={styles.arrow}
                  >
                    <ArrowRight className={styles.arrowIcon} />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
