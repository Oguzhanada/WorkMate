'use client';

import {useMemo, useState} from 'react';

import styles from './faq.module.css';
import layoutStyles from '../inner.module.css';

type HelpArticle = {
  id: string;
  title: string;
  section: string;
  updated: string;
  body: string[];
  related: string[];
};

const ARTICLES: HelpArticle[] = [
  {
    id: 'fees-and-pricing',
    title: 'How does WorkMate pricing work?',
    section: 'Fees and pricing',
    updated: 'Updated 26 February 2026',
    body: [
      'WorkMate aims to keep fees transparent and predictable. Our current target fee range is 8% to 10%.',
      'Final production fee policy will be published before launch and clearly shown before checkout.',
      'After a quote is accepted, the total agreed price should stay fixed unless both sides explicitly agree on a scope change.'
    ],
    related: ['payments-and-holds', 'support-response']
  },
  {
    id: 'payments-and-holds',
    title: 'How are payments protected on WorkMate?',
    section: 'Payments',
    updated: 'Updated 26 February 2026',
    body: [
      'Payments are handled through the platform flow and tracked in your dashboard.',
      'Funds can be held until the status flow is complete, then released according to WorkMate payment rules.',
      'Do not move active jobs off-platform for payment or direct contact sharing.'
    ],
    related: ['fees-and-pricing', 'disputes']
  },
  {
    id: 'support-response',
    title: 'How fast does support respond?',
    section: 'Support',
    updated: 'Updated 26 February 2026',
    body: [
      'WorkMate is building a fast-response support model with clear triage targets.',
      'Critical account or payment issues are prioritized, with status updates sent in-app.',
      'Response times can vary during peak periods, but every ticket gets a tracked resolution path.'
    ],
    related: ['account-verification', 'disputes']
  },
  {
    id: 'account-verification',
    title: 'How does account verification work?',
    section: 'Trust and safety',
    updated: 'Updated 26 February 2026',
    body: [
      'WorkMate uses document-level verification before activation for provider profiles.',
      'Identity and professional documents may be reviewed per document status (pending, approved, rejected).',
      'If more detail is required, admin feedback explains what should be corrected before re-submission.'
    ],
    related: ['provider-onboarding', 'support-response']
  },
  {
    id: 'provider-onboarding',
    title: 'How do I become a provider?',
    section: 'Providers',
    updated: 'Updated 26 February 2026',
    body: [
      'Complete provider onboarding, select your services, and upload required documents.',
      'You must be at least 18 and legally allowed to provide services in Ireland.',
      'After admin approval, you can start receiving matched leads and sending offers.'
    ],
    related: ['account-verification', 'ireland-focus']
  },
  {
    id: 'ireland-focus',
    title: 'Is WorkMate available outside Ireland?',
    section: 'Platform scope',
    updated: 'Updated 26 February 2026',
    body: [
      'WorkMate is intentionally focused on Ireland-only service matching.',
      'Location logic, compliance assumptions, and support processes are designed around Ireland.',
      'This focus helps keep product decisions simple and service quality consistent.'
    ],
    related: ['provider-onboarding', 'fees-and-pricing']
  },
  {
    id: 'disputes',
    title: 'What happens in a dispute?',
    section: 'Payments',
    updated: 'Updated 26 February 2026',
    body: [
      'Start with in-platform messaging and keep all evidence in the dispute flow.',
      'If unresolved, open a dispute from your dashboard and attach relevant proof.',
      'For criminal incidents, users should contact Gardaí directly.'
    ],
    related: ['payments-and-holds', 'support-response']
  }
];

const WHY_WORKMATE_STANDARDS = [
  'Transparent fees (target range 8-10%, final policy at launch).',
  'Faster support response targets with tracked case updates.',
  'Ireland-only focus for cleaner operations and stronger local trust.',
  'Document-level verification before activation for providers.'
];

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(ARTICLES[0]?.id ?? '');
  const [helpfulVote, setHelpfulVote] = useState<'yes' | 'no' | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ARTICLES;
    return ARTICLES.filter((article) => {
      const haystack = `${article.title} ${article.section} ${article.body.join(' ')}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  const activeArticle = useMemo(() => {
    if (filtered.length === 0) return null;
    const fromSelection = filtered.find((article) => article.id === activeId);
    return fromSelection ?? filtered[0];
  }, [filtered, activeId]);

  return (
    <main className={layoutStyles.section}>
      <div className={layoutStyles.container}>
        <header className={styles.header}>
          <h1>Help Center</h1>
          <p>
            Search support articles about pricing, verification, payments, and provider onboarding.
          </p>
          <label className={styles.searchWrap}>
            <span>Search help articles</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask a question"
            />
          </label>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <h2>Articles in this section</h2>
            {filtered.length === 0 ? (
              <p className={styles.muted}>No articles match your search.</p>
            ) : (
              <ul>
                {filtered.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      className={article.id === activeArticle?.id ? styles.articleButtonActive : styles.articleButton}
                      onClick={() => {
                        setActiveId(article.id);
                        setHelpfulVote(null);
                      }}
                    >
                      {article.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <article className={styles.article}>
            {activeArticle ? (
              <>
                <p className={styles.breadcrumb}>WorkMate Help Center / {activeArticle.section}</p>
                <h2>{activeArticle.title}</h2>
                <p className={styles.updated}>{activeArticle.updated}</p>

                {activeArticle.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                <section className={styles.standardsCard}>
                  <h3>Why WorkMate standards</h3>
                  <ul>
                    {WHY_WORKMATE_STANDARDS.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className={styles.related}>
                  <h3>Related articles</h3>
                  <div className={styles.relatedList}>
                    {activeArticle.related.map((relatedId) => {
                      const relatedArticle = ARTICLES.find((entry) => entry.id === relatedId);
                      if (!relatedArticle) return null;
                      return (
                        <button key={relatedArticle.id} type="button" onClick={() => setActiveId(relatedArticle.id)}>
                          {relatedArticle.title}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className={styles.helpful}>
                  <h3>Was this article helpful?</h3>
                  <div className={styles.helpfulButtons}>
                    <button
                      type="button"
                      className={helpfulVote === 'yes' ? styles.voteActive : styles.voteButton}
                      onClick={() => setHelpfulVote('yes')}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={helpfulVote === 'no' ? styles.voteActive : styles.voteButton}
                      onClick={() => setHelpfulVote('no')}
                    >
                      No
                    </button>
                  </div>
                </section>
              </>
            ) : (
              <p className={styles.muted}>No article selected.</p>
            )}
          </article>
        </div>
      </div>
    </main>
  );
}

