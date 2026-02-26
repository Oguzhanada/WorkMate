import styles from './auto-release.module.css';

export default function CustomerReleaseWarning() {
  return (
    <p className={styles.warn}>
      If you do not confirm completion or open a dispute, payment will be released automatically after 14 days.
    </p>
  );
}