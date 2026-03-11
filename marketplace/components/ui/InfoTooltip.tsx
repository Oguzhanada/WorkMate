"use client";

import {useState} from 'react';
import styles from './info-tooltip.module.css';

type Props = {
  text: string;
  label?: string;
};

export default function InfoTooltip({text, label = 'Info'}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`${styles.wrap} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.trigger}
        aria-label={label}
        title={text}
        onClick={() => setOpen((value) => !value)}
      >
        ?
      </button>
      <span className={styles.bubble} role="tooltip">
        {text}
      </span>
    </span>
  );
}
