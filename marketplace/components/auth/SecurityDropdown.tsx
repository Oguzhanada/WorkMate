"use client";

import Link from 'next/link';
import {AnimatePresence, motion} from 'framer-motion';
import {ChevronDown, Info, LockKeyhole, ShieldCheck} from 'lucide-react';

import styles from './login.module.css';
import {dropdownContentVariants} from '@/styles/animations';

type SecurityDropdownProps = {
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
};

export function SecurityDropdown({isOpen, onToggle, title = 'Secure Login'}: SecurityDropdownProps) {
  return (
    <section className={styles.dropdownRoot}>
      <button type="button" className={styles.dropdownToggle} onClick={onToggle}>
        <span>
          <LockKeyhole size={16} aria-hidden="true" /> {title}
        </span>
        <ChevronDown size={16} aria-hidden="true" style={{transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease'}} />
      </button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            className={styles.dropdownBody}
            variants={dropdownContentVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className={styles.dropdownInner}>
              <div className={styles.dropdownGroup}>
                <h4>Identity verification options:</h4>
                <ul>
                  <li>ID (registered users)</li>
                  <li>Safe Pass (providers)</li>
                  <li>Tax Clearance (providers)</li>
                </ul>
              </div>

              <div className={styles.dropdownGroup}>
                <h4>
                  <ShieldCheck size={14} aria-hidden="true" /> Your data is protected:
                </h4>
                <ul>
                  <li>256-bit AES encryption</li>
                  <li>GDPR compliant</li>
                  <li>Ireland-based servers</li>
                </ul>
              </div>

              <Link className={styles.moreLink} href="/privacy-policy">
                <Info size={14} aria-hidden="true" /> More about verification
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
