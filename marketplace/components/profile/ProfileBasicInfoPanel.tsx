"use client";

import {useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {hasAtLeastTwoNameParts, isValidEnglishFullName} from '@/lib/validation/name';
import {isValidIrishPhone, normalizeIrishPhone, sanitizePhoneInput} from '@/lib/validation/phone';
import styles from './profile-basic.module.css';

type Props = {
  initialFullName: string;
  initialPhone: string;
  email: string;
  statusLabel: string;
  initialEditField?: 'name' | 'phone' | null;
};

export default function ProfileBasicInfoPanel({
  initialFullName,
  initialPhone,
  email,
  statusLabel,
  initialEditField = null,
}: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [editField, setEditField] = useState<'name' | 'phone' | null>(initialEditField);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [isPending, setIsPending] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const phoneRef = useRef<HTMLInputElement | null>(null);

  const completionPercent = useMemo(() => {
    const checks = [
      hasAtLeastTwoNameParts(fullName),
      isValidEnglishFullName(fullName),
      isValidIrishPhone(phone),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [fullName, phone]);

  useEffect(() => {
    if (editField === 'name') {
      nameRef.current?.focus();
    }
    if (editField === 'phone') {
      phoneRef.current?.focus();
    }
  }, [editField]);

  const save = async () => {
    setError('');
    setOk('');
    if (!hasAtLeastTwoNameParts(fullName) || !isValidEnglishFullName(fullName)) {
      setError('Enter a valid full name (first + last, English letters only).');
      return;
    }
    if (!isValidIrishPhone(phone)) {
      setError('Enter a valid Irish mobile number (830446082, 0830446082, or +353830446082).');
      return;
    }

    setIsPending(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: {user},
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in again.');
        return;
      }
      const {error: updateError} = await supabase
        .from('profiles')
        .upsert({id: user.id, full_name: fullName.trim(), phone: normalizeIrishPhone(phone)}, {onConflict: 'id'});
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setEditField(null);
      setOk('Profile info updated.');
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2>Account Details</h2>

      <div className={styles.row}>
        <div className={styles.left}>
          <span className={styles.icon}>👤</span>
          <div>
            <strong>Full name</strong>
            {editField === 'name' ? (
              <input
                ref={nameRef}
                className={styles.input}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            ) : (
              <p>{fullName || '-'}</p>
            )}
          </div>
        </div>
        <button type="button" className={styles.editBtn} onClick={() => setEditField('name')}>
          ✏️
        </button>
      </div>

      <div className={styles.row}>
        <div className={styles.left}>
          <span className={styles.icon}>📧</span>
          <div>
            <strong>Email</strong>
            <p>{email || '-'}</p>
          </div>
        </div>
        <button type="button" className={styles.editBtn} disabled title="Email update is not enabled here">
          ✏️
        </button>
      </div>

      <div className={styles.row}>
        <div className={styles.left}>
          <span className={styles.icon}>📞</span>
          <div>
            <strong>Phone</strong>
            {editField === 'phone' ? (
              <input
                ref={phoneRef}
                className={styles.input}
                value={phone}
                onChange={(event) => setPhone(sanitizePhoneInput(event.target.value))}
                placeholder="830446082"
              />
            ) : (
              <p>{phone || '-'}</p>
            )}
          </div>
        </div>
        <button type="button" className={styles.editBtn} onClick={() => setEditField('phone')}>
          ✏️
        </button>
      </div>

      <div className={styles.statusRow}>
        <p>Verification status: <strong>{statusLabel}</strong></p>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{width: `${completionPercent}%`}} />
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.saveBtn} onClick={save} disabled={isPending}>
          {isPending ? 'Saving...' : 'Save profile info'}
        </button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {ok ? <p className={styles.ok}>{ok}</p> : null}
    </div>
  );
}
