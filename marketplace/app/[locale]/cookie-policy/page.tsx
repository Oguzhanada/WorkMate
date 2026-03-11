import styles from '../inner.module.css';

export const metadata = {
  title: 'Cookie Policy | WorkMate',
  description: 'Learn how WorkMate uses cookies and how to manage your preferences.',
};

export default function CookiePolicyPage() {
  return (
    <main className={styles.section}>
      <div className={styles.container} style={{ maxWidth: 780 }}>
        <article
          className={styles.card}
          style={{ padding: '40px 44px', display: 'grid', gap: 32, lineHeight: 1.7 }}
        >
          {/* ── Header ─────────────────────────────────────── */}
          <div>
            <h1
              style={{
                fontFamily: 'var(--wm-font-display)',
                color: 'var(--wm-navy)',
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                margin: '0 0 6px',
              }}
            >
              Cookie Policy
            </h1>
            <p style={{ color: 'var(--wm-muted)', fontSize: '0.875rem', margin: 0 }}>
              Last updated: 20 February 2026 · WorkMate Ireland
            </p>
          </div>

          {/* ── What are cookies ───────────────────────────── */}
          <Section title="1. What are cookies?">
            <p>
              Cookies are small text files stored on your device when you visit a website. They allow
              the site to recognise your device, remember your preferences, and provide a more reliable
              and personalised experience. Cookies cannot run programmes or deliver viruses.
            </p>
          </Section>

          {/* ── Legal basis ────────────────────────────────── */}
          <Section title="2. Legal basis">
            <p>
              Under the Irish ePrivacy Regulations (S.I. No. 336 of 2011) and the EU General Data
              Protection Regulation (GDPR), we are required to obtain your consent before placing
              non-essential cookies on your device. Essential cookies are placed on the basis of our
              legitimate interest in operating a secure, functional website.
            </p>
          </Section>

          {/* ── Types of cookies ───────────────────────────── */}
          <Section title="3. Cookies we use">
            <SubSection title="Essential cookies — always active">
              <p>
                These cookies are strictly necessary for the site to function. They cannot be disabled.
              </p>
              <CookieTable
                rows={[
                  {
                    name: 'sb-access-token / sb-refresh-token',
                    purpose: 'Supabase authentication session tokens',
                    duration: 'Session / 7 days',
                  },
                  {
                    name: 'wm_cookie_consent',
                    purpose: 'Stores your cookie preference choices',
                    duration: '12 months',
                  },
                  {
                    name: '__stripe_mid / __stripe_sid',
                    purpose: 'Stripe fraud prevention and payment security',
                    duration: '12 months / Session',
                  },
                ]}
              />
            </SubSection>

            <SubSection title="Analytics cookies — opt-in">
              <p>
                These cookies help us understand how visitors interact with WorkMate, so we can improve
                search relevance, quote quality, and overall service. They are only placed with your
                consent.
              </p>
              <CookieTable
                rows={[
                  {
                    name: 'Cloudflare Web Analytics',
                    purpose: 'Privacy-first, cookieless page-view analytics. No cross-site tracking.',
                    duration: 'Session (no persistent cookie)',
                  },
                  {
                    name: 'Sentry',
                    purpose: 'Error tracking and performance monitoring',
                    duration: 'Session',
                  },
                ]}
              />
            </SubSection>

            <SubSection title="Marketing cookies — opt-in">
              <p>
                We do not currently use marketing or advertising cookies. If this changes, we will
                update this policy and request your consent before placing any marketing cookies.
              </p>
            </SubSection>
          </Section>

          {/* ── Third-party services ───────────────────────── */}
          <Section title="4. Third-party services">
            <p>
              WorkMate uses the following third-party services that may set their own cookies or
              process data on your device:
            </p>
            <ul style={{ paddingLeft: 20, margin: '10px 0 0', display: 'grid', gap: 8 }}>
              <li>
                <strong>Supabase</strong> — database and authentication provider. Supabase is hosted
                in the EU (AWS eu-west-1, Ireland). See the{' '}
                <ExternalLink href="https://supabase.com/privacy">Supabase Privacy Policy</ExternalLink>.
              </li>
              <li>
                <strong>Stripe</strong> — secure payment processing. Stripe may set cookies to
                prevent fraud. See the{' '}
                <ExternalLink href="https://stripe.com/ie/privacy">Stripe Privacy Policy</ExternalLink>.
              </li>
              <li>
                <strong>Cloudflare</strong> — CDN, security, and web analytics. See the{' '}
                <ExternalLink href="https://www.cloudflare.com/privacypolicy/">
                  Cloudflare Privacy Policy
                </ExternalLink>
                .
              </li>
              <li>
                <strong>Sentry</strong> — error monitoring. See the{' '}
                <ExternalLink href="https://sentry.io/privacy/">Sentry Privacy Policy</ExternalLink>.
              </li>
            </ul>
          </Section>

          {/* ── Managing your preferences ──────────────────── */}
          <Section title="5. Managing your preferences">
            <p>
              You can manage or withdraw your consent at any time using the{' '}
              <strong>Cookie Preferences</strong> banner at the bottom of any WorkMate page. Your
              choices are saved in your browser&apos;s local storage under the key{' '}
              <code
                style={{
                  background: 'var(--wm-bg)',
                  border: '1px solid var(--wm-border)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  fontSize: '0.85em',
                  fontFamily: 'monospace',
                }}
              >
                wm_cookie_consent
              </code>
              .
            </p>
            <p style={{ marginTop: 12 }}>
              You can also manage cookies directly in your browser settings:
            </p>
            <ul style={{ paddingLeft: 20, margin: '8px 0 0', display: 'grid', gap: 6 }}>
              <li>
                <ExternalLink href="https://support.google.com/chrome/answer/95647">
                  Google Chrome
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://support.mozilla.org/kb/enable-and-disable-cookies-website-preferences">
                  Mozilla Firefox
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://support.apple.com/guide/safari/manage-cookies-sfri11471">
                  Apple Safari
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge">
                  Microsoft Edge
                </ExternalLink>
              </li>
            </ul>
            <p style={{ marginTop: 12 }}>
              Blocking essential cookies may prevent you from signing in or completing payments.
            </p>
          </Section>

          {/* ── Data retention ─────────────────────────────── */}
          <Section title="6. Data retention">
            <p>
              Cookie data is retained only for as long as necessary to fulfil the purpose described
              above. Analytics data is aggregated and anonymised. Authentication session data is
              deleted when you sign out or after the session expiry period.
            </p>
          </Section>

          {/* ── Your rights ────────────────────────────────── */}
          <Section title="7. Your rights">
            <p>
              Under GDPR you have the right to access, rectify, and erase personal data collected
              via cookies, as well as the right to object to or restrict processing. To exercise
              these rights, contact us at the address below. You also have the right to lodge a
              complaint with the{' '}
              <ExternalLink href="https://www.dataprotection.ie">
                Data Protection Commission (DPC)
              </ExternalLink>
              .
            </p>
          </Section>

          {/* ── Contact ────────────────────────────────────── */}
          <Section title="8. Contact">
            <p>
              For any questions about this policy or our use of cookies, please contact us at{' '}
              <a
                href="mailto:privacy@workmate.ie"
                style={{ color: 'var(--wm-primary-dark)', fontWeight: 600 }}
              >
                privacy@workmate.ie
              </a>
              .
            </p>
          </Section>
        </article>
      </div>
    </main>
  );
}

/* ── Helper sub-components ─────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <h2
        style={{
          fontFamily: 'var(--wm-font-display)',
          color: 'var(--wm-navy)',
          fontSize: '1.15rem',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '-0.015em',
        }}
      >
        {title}
      </h2>
      <div style={{ color: 'var(--wm-text)', fontSize: '0.93rem' }}>{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16 }}>
      <h3
        style={{
          fontFamily: 'var(--wm-font-display)',
          color: 'var(--wm-navy)',
          fontSize: '0.96rem',
          fontWeight: 700,
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function CookieTable({
  rows,
}: {
  rows: { name: string; purpose: string; duration: string }[];
}) {
  return (
    <div
      style={{
        marginTop: 10,
        border: '1px solid var(--wm-border)',
        borderRadius: 'var(--wm-radius-md)',
        overflow: 'hidden',
        fontSize: '0.85rem',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--wm-bg)' }}>
            {['Cookie / Service', 'Purpose', 'Duration'].map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: 700,
                  color: 'var(--wm-navy)',
                  borderBottom: '1px solid var(--wm-border)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 0 ? 'white' : 'var(--wm-bg)' }}
            >
              <td style={{ padding: '8px 12px', color: 'var(--wm-navy)', fontWeight: 600 }}>
                {r.name}
              </td>
              <td style={{ padding: '8px 12px', color: 'var(--wm-muted)' }}>{r.purpose}</td>
              <td style={{ padding: '8px 12px', color: 'var(--wm-muted)', whiteSpace: 'nowrap' }}>
                {r.duration}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'var(--wm-primary-dark)', fontWeight: 600 }}
    >
      {children}
    </a>
  );
}
