"use client";

import {motion} from 'framer-motion';
import {UserRound, Wrench} from 'lucide-react';

import styles from './login.module.css';

export type AccountRole = 'customer' | 'provider';

type RoleSelectorProps = {
  value: AccountRole;
  onChange: (role: AccountRole) => void;
};

const roleCards = [
  {
    key: 'customer' as const,
    title: 'Customer',
    subtitle: 'I need work',
    icon: UserRound
  },
  {
    key: 'provider' as const,
    title: 'Provider',
    subtitle: 'I offer work',
    icon: Wrench
  }
];

export function RoleSelector({value, onChange}: RoleSelectorProps) {
  return (
    <div className={styles.roleGrid}>
      {roleCards.map(({key, title, subtitle, icon: Icon}) => (
        <motion.button
          key={key}
          type="button"
          whileHover={{scale: 1.02}}
          whileTap={{scale: 0.99}}
          animate={value === key ? {x: [0, -2, 2, 0]} : {x: 0}}
          transition={{duration: 0.22}}
          className={`${styles.roleCard} ${value === key ? styles.roleCardActive : ''}`}
          onClick={() => onChange(key)}
        >
          <span className={styles.roleCardTitle}>
            <Icon size={16} aria-hidden="true" /> {title}
          </span>
          <span className={styles.roleCardSubtitle}>{subtitle}</span>
        </motion.button>
      ))}
    </div>
  );
}
