import type { Metadata } from 'next';
import Link from 'next/link';

import styles from '../inner.module.css';

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description: 'Rules and standards for the WorkMate community.',
};

const quickRules = [
  '18+ only and one active account per person.',
  'Be respectful: abuse, hate speech, or harassment is not allowed.',
  'Keep communication and payments on WorkMate.',
  'No illegal, unsafe, or prohibited services.',
  'Accepted offers are binding: no price changes after acceptance.'
];

const prohibitedServices = [
  'Academic cheating services (essays, dissertations, exam misconduct)',
  'Illegal substances, weapons, or related facilitation',
  'Adult sexual services',
  'Hate speech, discrimination, or violent extremist content',
  'Unlicensed financial schemes, lending, or MLM-style recruiting'
];

export default function CommunityGuidelinesPage() {
  return (
    <main className={styles.section}>
      <div className={styles.container}>
        <article className={styles.card}>
          <h1>Community Guidelines</h1>
          <p className={styles.muted}>Last updated: 26 February 2026</p>
          <p className={styles.muted}>
            WorkMate is built for trusted local service matching in Ireland. We want clear expectations
            for customers and providers so every job stays safe, fair, and professional.
          </p>

          <h2>At a glance</h2>
          <ul className={styles.checkGrid}>
            {quickRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>

          <h2>Account and eligibility</h2>
          <ul className={styles.checkGrid}>
            <li>All users must be at least 18 years old.</li>
            <li>Only one active account per person is allowed.</li>
            <li>Users must provide accurate identity and profile information when requested.</li>
          </ul>

          <h2>Respectful conduct</h2>
          <ul className={styles.checkGrid}>
            <li>No abuse, threats, hate speech, or discrimination.</li>
            <li>Keep communication professional and relevant to the job.</li>
            <li>
              Friendly local tone is welcome. A bit of Irish craic is fine, as long as it remains respectful.
            </li>
          </ul>

          <h2>Legal and safety requirements in Ireland</h2>
          <ul className={styles.checkGrid}>
            <li>Only legal services may be requested or offered.</li>
            <li>
              For regulated works (for example restricted electrical or gas work), providers must hold
              required registrations and certifications.
            </li>
            <li>Providers are responsible for tax and legal compliance in Ireland.</li>
            <li>Customers must disclose relevant job-site safety risks.</li>
          </ul>

          <h2>Offers, pricing, and job integrity</h2>
          <ul className={styles.checkGrid}>
            <li>Once an offer is accepted, the agreed total price cannot be changed unilaterally.</li>
            <li>Vague pricing (e.g. open-ended hourly/weekly totals) is not allowed.</li>
            <li>Accepted work cannot be subcontracted to a different person without explicit customer approval.</li>
            <li>The person attending the job should match the profile accepted by the customer.</li>
          </ul>

          <h2>Off-platform activity is prohibited</h2>
          <ul className={styles.checkGrid}>
            <li>Do not share direct contact details to bypass platform messaging.</li>
            <li>Do not request or accept off-platform payment for active WorkMate jobs.</li>
          </ul>

          <h2>Prohibited services and content</h2>
          <ul className={styles.checkGrid}>
            {prohibitedServices.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2>Disputes and incidents</h2>
          <p className={styles.muted}>
            WorkMate is not a party to customer-provider contracts. Funds are held and released according
            to the payment flow and dispute rules. If a problem occurs:
          </p>
          <ol className={styles.checkGrid}>
            <li>Try to resolve it in WorkMate messages first.</li>
            <li>Open a formal dispute if needed and attach evidence.</li>
            <li>For criminal issues, contact Gardaí immediately.</li>
          </ol>

          <h2>Enforcement model</h2>
          <ul className={styles.checkGrid}>
            <li>First issue: warning and education notice.</li>
            <li>Repeated issue: temporary restrictions or suspension.</li>
            <li>Serious or repeated abuse: permanent account removal.</li>
          </ul>

          <p className={styles.muted}>
            Related policies:{' '}
            <Link href="/privacy-policy">Privacy Policy</Link>{' '}
            and{' '}
            <Link href="/terms">Terms of Service</Link>.
          </p>
        </article>
      </div>
    </main>
  );
}

