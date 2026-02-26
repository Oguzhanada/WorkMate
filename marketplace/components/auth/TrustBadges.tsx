import styles from './login.module.css';

const badges = ['🔒 SSL Secure', '🇮🇪 Ireland', '✅ GDPR', '256-bit'];

export function TrustBadges() {
  return (
    <footer className={styles.footerBadges} aria-label="Security badges">
      {badges.map((badge) => (
        <span key={badge} className={styles.footerBadge}>
          {badge}
        </span>
      ))}
    </footer>
  );
}
