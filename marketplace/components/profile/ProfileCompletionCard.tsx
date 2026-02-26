"use client";

import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import styles from './profile-completion.module.css';

type CompletionStatus = 'missing' | 'pending' | 'complete';

type CompletionItem = {
  id: string;
  title: string;
  description: string;
  status: CompletionStatus;
  href: string;
  formHint: string;
  reasonHint?: string;
};

type Props = {
  items: CompletionItem[];
  showProviderCta?: boolean;
};

function icon(status: CompletionStatus) {
  if (status === 'complete') return '✅';
  if (status === 'pending') return '⏳';
  return '⭕';
}

export default function ProfileCompletionCard({items, showProviderCta = false}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const completeCount = useMemo(() => items.filter((item) => item.status === 'complete').length, [items]);
  const targetPercent = useMemo(
    () => (items.length ? Math.round((completeCount / items.length) * 100) : 0),
    [items.length, completeCount]
  );
  const progressColor = useMemo(() => {
    if (animatedPercent < 30) return '#ff7675';
    if (animatedPercent < 70) return '#e59b2e';
    return '#00b894';
  }, [animatedPercent]);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const duration = 900;
    const step = (now: number) => {
      const ratio = Math.min(1, (now - start) / duration);
      setAnimatedPercent(Math.round(targetPercent * ratio));
      if (ratio < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [targetPercent]);

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <div>
          <h2>Profile Completion</h2>
          <p>Keep your profile up to date to improve trust and response quality.</p>
        </div>
        <Link className={styles.completeButton} href={items.find((item) => item.status !== 'complete')?.href ?? '/profile'}>
          Complete Profile
        </Link>
      </div>

      <div className={styles.progressLine}>
        <div className={styles.progressFill} style={{width: `${animatedPercent}%`, background: progressColor}} />
      </div>
      <p className={styles.percent}>{animatedPercent}% complete</p>

      <div className={styles.list}>
        {items.map((item, index) => {
          const isOpen = openId === item.id;
          return (
            <article key={item.id} className={styles.item} style={{animationDelay: `${index * 80}ms`}}>
              <button
                type="button"
                className={styles.itemHead}
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              >
                <span className={styles.state}>{icon(item.status)}</span>
                <span className={styles.copy}>
                  <strong>
                    {item.title}
                    <span className={styles.tipWrap}>
                      <span className={styles.tipMark}>?</span>
                      <span className={styles.tipBubble}>
                        {item.reasonHint ?? item.description}
                      </span>
                    </span>
                  </strong>
                  <small>{item.description}</small>
                  <small
                    className={
                      item.status === 'complete'
                        ? styles.doneText
                        : item.status === 'pending'
                        ? styles.pendingText
                        : styles.missingText
                    }
                  >
                    {item.status === 'complete'
                      ? 'Completed'
                      : item.status === 'pending'
                      ? 'Pending review'
                      : 'Not added yet'}
                  </small>
                </span>
                <span className={styles.actionWrap}>
                  <Link href={item.href} className={styles.addBtn} onClick={(event) => event.stopPropagation()}>
                    {item.status === 'complete' ? 'Edit' : 'Add'}
                  </Link>
                </span>
              </button>
              {isOpen ? (
                <div className={styles.miniForm}>
                  <p>{item.formHint}</p>
                  <Link href={item.href} className={styles.miniOpen}>
                    Open
                  </Link>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <button type="button" className={styles.remind}>
        Remind Me Later
      </button>

      {showProviderCta ? (
        <div className={styles.providerCta}>
          <div>
            <strong>Want to work as a provider?</strong>
            <p>Complete provider verification to unlock leads and quoting access.</p>
          </div>
          <Link href="/become-provider" className={styles.providerCtaButton}>
            Become a Provider
          </Link>
        </div>
      ) : null}
    </article>
  );
}
