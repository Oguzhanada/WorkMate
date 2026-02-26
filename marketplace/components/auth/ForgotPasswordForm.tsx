"use client";

import Link from 'next/link';
import {FormEvent, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {ChevronDown, Loader2, Mail, MessageSquareMore} from 'lucide-react';
import {z} from 'zod';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {dropdownContentVariants, formItemVariants, formListVariants, rightColumnVariants} from '@/styles/animations';
import styles from './login.module.css';

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.')
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [form, setForm] = useState<ForgotPasswordData>({email: ''});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const sendReset = async () => {
    setError('');

    const parsed = forgotPasswordSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please enter a valid email address.');
      return;
    }

    setIsPending(true);
    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const {error: resetError} = await supabase.auth.resetPasswordForEmail(parsed.data.email, {redirectTo});
    setIsPending(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSuccess(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendReset();
  };

  return (
    <motion.section
      className={`${styles.panel} ${styles.formPanel}`}
      variants={rightColumnVariants}
      initial="hidden"
      animate="visible"
      aria-label="Forgot password form"
    >
      <h2 className={styles.formTitle}>Reset your password</h2>
      <p className={styles.formSubtitle}>Enter your email and we&apos;ll send a reset link.</p>

      {error ? <div className={styles.error}>{error}</div> : null}

      <motion.form variants={formListVariants} initial="hidden" animate="visible" onSubmit={onSubmit}>
        <motion.label variants={formItemVariants} className={styles.field}>
          <span>Email</span>
          <div className={styles.inputWrap}>
            <Mail size={16} aria-hidden="true" />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({email: event.target.value})}
              placeholder="your@email.com"
            />
          </div>
        </motion.label>

        <motion.div variants={formItemVariants}>
          <button type="submit" className={styles.primaryButton} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 size={18} className={styles.spinner} /> Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </button>
        </motion.div>

        <AnimatePresence>
          {success ? (
            <motion.div
              initial={{opacity: 0, y: 8}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: 8}}
              className={styles.toast}
            >
              <strong>Reset link sent!</strong>
              <div>Check your email inbox (and spam folder).</div>
              <div>
                Didn&apos;t receive it?{' '}
                <button
                  type="button"
                  onClick={sendReset}
                  style={{border: 0, background: 'transparent', color: '#0066cc', cursor: 'pointer'}}
                >
                  Resend
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.p variants={formItemVariants} className={styles.linkRow} style={{textAlign: 'left'}}>
          <Link href="/login">← Back to login</Link>
        </motion.p>

        <motion.section variants={formItemVariants} className={styles.dropdownRoot}>
          <button type="button" className={styles.dropdownToggle} onClick={() => setIsHelpOpen((v) => !v)}>
            <span>
              <MessageSquareMore size={16} aria-hidden="true" /> Need help? Contact support
            </span>
            <ChevronDown
              size={16}
              aria-hidden="true"
              style={{transform: isHelpOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease'}}
            />
          </button>

          <AnimatePresence initial={false}>
            {isHelpOpen ? (
              <motion.div
                className={styles.dropdownBody}
                variants={dropdownContentVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <div className={styles.dropdownInner}>
                  <p>Support email: support@workmate.ie</p>
                  <p>
                    FAQ: <Link href="/faq">See common answers</Link>
                  </p>
                  <p>Live chat: coming soon</p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>
      </motion.form>
    </motion.section>
  );
}
