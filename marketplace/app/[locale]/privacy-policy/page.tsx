import styles from '../inner.module.css';

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <article className={styles.card}>
          <h1>Privacy Policy</h1>
          <p className={styles.muted}>Last updated: 25 February 2026</p>

          <h2>Who we are</h2>
          <p className={styles.muted}>
            WorkMate is an Ireland-based services marketplace. We process personal data to match
            customers with providers, keep the platform safe, and meet legal obligations.
          </p>

          <h2>Data we collect</h2>
          <p className={styles.muted}>
            We may collect: name, email, phone, profile details, address and Eircode, account
            activity, messages, payment metadata, identity verification files, Safe Pass
            information, tax clearance references, insurance-related documents, and service history.
          </p>

          <h2>Why we collect it</h2>
          <p className={styles.muted}>
            We use data for account security, identity verification, fraud prevention, trust and
            quality checks, payment processing, dispute handling, customer support, and legal/regulatory
            compliance.
          </p>

          <h2>Retention periods</h2>
          <p className={styles.muted}>
            Identity documents are retained for verification and then removed from storage after
            approval (target: 30 days after approval) or as soon as possible after rejection. Tax
            and finance-related records may be retained for up to 7 years to satisfy Irish legal and
            accounting obligations.
          </p>

          <h2>Processors and sharing</h2>
          <p className={styles.muted}>
            We use vetted providers to operate the service. This can include ID-Pal for identity
            workflows and regulated payment providers. Where legally required, information may be
            disclosed to competent authorities (including tax-related requests in Ireland).
          </p>

          <h2>Your GDPR rights</h2>
          <p className={styles.muted}>
            You can request access, correction, deletion, restriction, portability, or object to
            certain processing. You can also request account deletion from your profile privacy
            actions.
          </p>

          <h2>Regulatory contact</h2>
          <p className={styles.muted}>
            For privacy requests contact: privacy@workmate.ie
            <br />
            Supervisory authority: Data Protection Commission (Ireland).
          </p>
        </article>
      </div>
    </main>
  );
}
