'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { usePathname } from 'next/navigation';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

type HelpArticle = {
  id: string;
  title: string;
  section: 'Pricing' | 'Payments' | 'Trust and safety' | 'Providers' | 'Platform';
  body: string[];
};

const ARTICLES: HelpArticle[] = [
  {
    id: 'pricing',
    title: 'How does WorkMate pricing work?',
    section: 'Pricing',
    body: [
      'Posting a task is free for customers. You only pay when you accept an offer and move into booking flow.',
      'Providers submit offers based on scope, urgency, and materials. Always review what is included before confirming.',
    ],
  },
  {
    id: 'payment-protection',
    title: 'How are payments protected?',
    section: 'Payments',
    body: [
      'Payments are processed through platform flows and tracked in your dashboard.',
      'Do not move active jobs and payments off-platform. This keeps evidence, support, and dispute flow available.',
    ],
  },
  {
    id: 'verification',
    title: 'How does verification work?',
    section: 'Trust and safety',
    body: [
      'Provider onboarding includes document review and profile checks before activation.',
      'If a document is rejected, admin feedback explains what to correct and re-upload.',
    ],
  },
  {
    id: 'provider-start',
    title: 'How can I start as a provider?',
    section: 'Providers',
    body: [
      'Complete onboarding, service setup, and required verification documents.',
      'After approval, matched opportunities appear in your provider dashboard.',
    ],
  },
  {
    id: 'ireland',
    title: 'Is WorkMate available outside Ireland?',
    section: 'Platform',
    body: [
      'WorkMate currently focuses on Ireland-only operations and local compliance.',
      'Location, policy, and support workflows are optimized for the Irish market.',
    ],
  },
];

const SECTION_ORDER: Array<HelpArticle['section']> = [
  'Pricing',
  'Payments',
  'Trust and safety',
  'Providers',
  'Platform',
];

export default function FaqPage() {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState(ARTICLES[0].id);
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return ARTICLES;
    return ARTICLES.filter((item) => {
      const combined = `${item.title} ${item.section} ${item.body.join(' ')}`.toLowerCase();
      return combined.includes(term);
    });
  }, [query]);

  const active = filtered.find((item) => item.id === activeId) ?? filtered[0] ?? null;

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="rounded-3xl">
          <h1>Help Center</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
            Search support articles, then contact the team if you need account-specific help.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search help topics"
              className="rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--wm-border)' }}
            />
            <Button href={withLocalePrefix(localeRoot, '/contact')} variant="secondary" size="sm">
              Contact support
            </Button>
            <Button href={withLocalePrefix(localeRoot, '/blog')} variant="ghost" size="sm">
              Read updates
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Card className="rounded-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--wm-subtle)' }}>
              Categories
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {SECTION_ORDER.map((section) => {
                const count = filtered.filter((item) => item.section === section).length;
                return (
                  <li key={section} className="flex items-center justify-between rounded-lg px-2 py-1.5">
                    <span>{section}</span>
                    <span className="text-xs" style={{ color: 'var(--wm-muted)' }}>{count}</span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs" style={{ color: 'var(--wm-subtle)' }}>
              Need urgent assistance? Use the contact form for payment and verification issues.
            </p>
          </Card>

          <Card className="rounded-2xl">
            {!active ? (
              <p className="text-sm" style={{ color: 'var(--wm-muted)' }}>
                No article matched your search.
              </p>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--wm-subtle)' }}>
                  {active.section}
                </p>
                <h2 className="mt-2 text-xl font-bold">{active.title}</h2>
                <div className="mt-3 space-y-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
                  {active.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </>
            )}

            <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--wm-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--wm-subtle)' }}>
                All articles
              </p>
              <div className="mt-2 grid gap-2">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="rounded-lg border px-3 py-2 text-left text-sm"
                    style={{
                      borderColor: item.id === active?.id ? 'var(--wm-primary)' : 'var(--wm-border)',
                      background: item.id === active?.id ? 'var(--wm-primary-faint)' : 'transparent',
                    }}
                    onClick={() => setActiveId(item.id)}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={withLocalePrefix(localeRoot, '/contact')} className="text-sm font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
                Open support form
              </Link>
              <span style={{ color: 'var(--wm-border)' }}>•</span>
              <Link href={withLocalePrefix(localeRoot, '/community-guidelines')} className="text-sm font-semibold" style={{ color: 'var(--wm-primary-dark)' }}>
                Community guidelines
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
