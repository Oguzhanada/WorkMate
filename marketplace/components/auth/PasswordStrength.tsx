"use client";

import {CheckCircle2, Circle} from 'lucide-react';

import styles from './login.module.css';

export type PasswordChecks = {
  minLength: boolean;
  lower: boolean;
  upper: boolean;
  number: boolean;
  special: boolean;
};

type PasswordStrengthProps = {
  password: string;
  checks: PasswordChecks;
};

function getStrengthColor(score: number) {
  if (score < 30) return 'var(--wm-destructive)';
  if (score < 70) return 'var(--wm-amber)';
  return 'var(--wm-primary)';
}

export function PasswordStrength({password, checks}: PasswordStrengthProps) {
  const matched = Object.values(checks).filter(Boolean).length;
  const score = Math.round((matched / 5) * 100);
  const strengthLabel = score >= 70 ? 'Strong password' : 'Weak password';

  return (
    <section className={styles.strengthCard}>
      <p className={styles.strengthTitle}>Password strength: {score}%</p>
      <div className={styles.strengthBar}>
        <div
          className={styles.strengthFill}
          style={{width: `${score}%`, backgroundColor: getStrengthColor(score)}}
        />
      </div>
      <p className={styles.formMuted}>{strengthLabel}</p>

      <ul className={styles.strengthList}>
        <li className={`${styles.strengthItem} ${password.length > 0 ? styles.strengthOk : ''}`}>
          {password.length > 0 ? <CheckCircle2 size={14} /> : <Circle size={14} />} All letters & characters
        </li>
        <li className={`${styles.strengthItem} ${checks.lower ? styles.strengthOk : ''}`}>
          {checks.lower ? <CheckCircle2 size={14} /> : <Circle size={14} />} At least 1 lowercase
        </li>
        <li className={`${styles.strengthItem} ${checks.upper ? styles.strengthOk : ''}`}>
          {checks.upper ? <CheckCircle2 size={14} /> : <Circle size={14} />} At least 1 uppercase
        </li>
        <li className={`${styles.strengthItem} ${checks.number ? styles.strengthOk : ''}`}>
          {checks.number ? <CheckCircle2 size={14} /> : <Circle size={14} />} At least 1 number
        </li>
        <li className={`${styles.strengthItem} ${checks.special ? styles.strengthOk : ''}`}>
          {checks.special ? <CheckCircle2 size={14} /> : <Circle size={14} />} At least 1 special character
        </li>
      </ul>
    </section>
  );
}
