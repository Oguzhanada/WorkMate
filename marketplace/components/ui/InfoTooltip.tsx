"use client";

import styles from './info-tooltip.module.css';

type Props = {
  text: string;
  label?: string;
};

export default function InfoTooltip({text, label = 'Info'}: Props) {
  return (
    <span className={styles.wrap}>
      <button type="button" className={styles.trigger} aria-label={label}>
        ?
      </button>
      <span className={styles.bubble} role="tooltip">
        {text}
      </span>
    </span>
  );
}
