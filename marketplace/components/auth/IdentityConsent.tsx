"use client";

import Link from 'next/link';
import {ShieldCheck} from 'lucide-react';

import styles from './login.module.css';

type IdentityConsentProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function IdentityConsent({checked, onChange}: IdentityConsentProps) {
  return (
    <section
      className={styles.consentCard}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onChange(!checked);
        }
      }}
    >
      <p className={styles.consentHead}>
        <ShieldCheck size={16} aria-hidden="true" /> Identity Verification Consent
      </p>
      <p className={styles.consentBody}>
        I consent to uploading an identity document (passport/driving licence) to keep the platform
        safe. Documents are used only for verification, protected under GDPR, and removed after
        retention deadlines.
      </p>
      <label className={styles.consentRow}>
        <input
          type="checkbox"
          checked={checked}
          readOnly
        />
        <span>
          I agree to identity verification processing and the{' '}
          <Link href="/privacy-policy" onClick={(event) => event.stopPropagation()}>
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/community-guidelines" onClick={(event) => event.stopPropagation()}>
            Community Guidelines
          </Link>
          .{' '}
          <Link href="/gdpr-compliance" target="_blank" onClick={(event) => event.stopPropagation()}>
            Learn more about GDPR
          </Link>
          .
        </span>
      </label>
    </section>
  );
}
