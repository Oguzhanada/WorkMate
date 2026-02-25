"use client";

import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';

import styles from './profile-avatar.module.css';

type Props = {
  initialAvatarUrl: string;
  initialFullName: string;
  compact?: boolean;
  autoOpenPicker?: boolean;
};

export default function ProfileAvatarPanel({
  initialAvatarUrl,
  initialFullName,
  compact = false,
  autoOpenPicker = false,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const initials = initialFullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  const uploadAvatar = async (file: File) => {
    setError('');
    setMessage('');

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      setError('Avatar must be PNG, JPG, JPEG or WEBP.');
      return;
    }

    setIsPending(true);
    try {
      const body = new FormData();
      body.append('avatar', file);
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body,
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Avatar upload failed.');
        return;
      }

      const nextAvatarUrl = payload.avatar_url;
      setAvatarUrl(nextAvatarUrl);
      setSelectedFileName(file.name);
      setMessage('Profile photo updated.');
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    if (!autoOpenPicker) return;
    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 80);
    return () => clearTimeout(timer);
  }, [autoOpenPicker]);

  return (
    <article className={compact ? styles.compactCard : styles.card}>
      {compact ? null : <h2>Profile photo</h2>}
      <div className={styles.row}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile avatar" className={styles.avatar} />
        ) : (
          <div className={styles.fallback}>{initials}</div>
        )}
        <div className={styles.actions}>
          <input
            ref={fileInputRef}
            className={styles.hiddenInput}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={async (event) => {
              const picked = event.target.files?.[0] ?? null;
              if (!picked) return;
              setSelectedFileName(picked.name);
              await uploadAvatar(picked);
              event.currentTarget.value = '';
            }}
          />
          {selectedFileName ? <small className={styles.fileName}>{selectedFileName}</small> : null}
          <button
            type="button"
            className={styles.primary}
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            {isPending ? 'Uploading...' : 'Choose photo'}
          </button>
          {avatarUrl ? (
            <button
              type="button"
              className={styles.secondary}
              onClick={async () => {
                setError('');
                setMessage('');
                const response = await fetch('/api/profile/avatar', { method: 'DELETE' });
                const payload = await response.json();
                if (!response.ok) {
                  setError(payload.error || 'Could not remove profile photo.');
                  return;
                }
                setAvatarUrl('');
                setMessage('Profile photo removed.');
                router.refresh();
              }}
            >
              Remove photo
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.ok}>{message}</p> : null}
    </article>
  );
}
