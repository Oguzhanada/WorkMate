import styles from './profile-verification.module.css';

export default function VerificationBadge({
  idVerificationMethod,
  stripeIdentityStatus,
}: {
  idVerificationMethod?: string | null;
  stripeIdentityStatus?: string | null;
}) {
  const isStripeVerified = idVerificationMethod === 'stripe_identity' && stripeIdentityStatus === 'verified';
  if (!isStripeVerified) return null;

  return <span className={styles.statusBadge}>Stripe Verified</span>;
}