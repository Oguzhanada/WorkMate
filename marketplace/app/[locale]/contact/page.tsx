'use client';

import { FormEvent, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { getLocaleRoot, withLocalePrefix } from '@/lib/i18n/locale-path';

const SUPPORT_TOPICS = [
  'Booking support',
  'Payment and invoices',
  'Provider onboarding',
  'Verification and documents',
  'Account and security',
];

export default function ContactPage() {
  const t = useTranslations('contact');
  const common = useTranslations('common');
  const [success, setSuccess] = useState(false);
  const pathname = usePathname() || '/';
  const localeRoot = getLocaleRoot(pathname);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSuccess(true);
  };

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="rounded-3xl">
          <h1>{t('title')}</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
            {t('subtitle')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button href={withLocalePrefix(localeRoot, '/faq')} variant="secondary" size="sm">
              Open help center
            </Button>
            <Button href={withLocalePrefix(localeRoot, '/blog')} variant="ghost" size="sm">
              Product updates
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <h3 className="text-base font-bold">{t('email')}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
              support@workmate.ie
            </p>
          </Card>
          <Card>
            <h3 className="text-base font-bold">{t('phone')}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
              +353 1 555 1000
            </p>
          </Card>
          <Card>
            <h3 className="text-base font-bold">{t('hours')}</h3>
            <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
              Mon-Fri 09:00 - 18:00
            </p>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card className="rounded-2xl">
            <h2 className="text-xl font-bold">{t('formTitle')}</h2>
            {success ? (
              <p className="mt-3 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'var(--wm-primary)', background: 'var(--wm-primary-faint)' }}>
                {t('success')}
              </p>
            ) : null}

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block">{t('name')}</span>
                <input required className="w-full rounded-xl border px-3 py-2" style={{ borderColor: 'var(--wm-border)' }} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">{common('city')}</span>
                <input required className="w-full rounded-xl border px-3 py-2" style={{ borderColor: 'var(--wm-border)' }} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">Topic</span>
                <select className="w-full rounded-xl border px-3 py-2" style={{ borderColor: 'var(--wm-border)' }}>
                  {SUPPORT_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block">{t('message')}</span>
                <textarea rows={5} required className="w-full rounded-xl border px-3 py-2" style={{ borderColor: 'var(--wm-border)' }} />
              </label>
              <Button type="submit" variant="primary">
                {t('submit')}
              </Button>
            </form>
          </Card>

          <Card className="rounded-2xl">
            <h3 className="text-base font-bold">Support priorities</h3>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
              <li>Payment and account access issues are triaged first.</li>
              <li>Verification/document questions include step-by-step guidance.</li>
              <li>All tickets receive tracked follow-up in order of urgency.</li>
            </ul>
            <div className="mt-4 rounded-xl border p-3 text-sm" style={{ borderColor: 'var(--wm-border)' }}>
              For urgent safety incidents, contact local emergency services first, then notify WorkMate support.
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
