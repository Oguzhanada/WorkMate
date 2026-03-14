import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

// Blog articles are static — revalidate every 30 minutes
export const revalidate = 1800;

/* ------------------------------------------------------------------ */
/*  Article data                                                        */
/* ------------------------------------------------------------------ */

type Article = {
  slug: string;
  title: string;
  summary: string;
  tag: string;
  publishedAt: string;
  readMinutes: number;
  content: React.ReactNode;
};

const ARTICLES: Article[] = [
  {
    slug: 'faster-task-posts',
    title: 'How to write a task post that gets better offers',
    summary: 'Use scope, urgency, and budget clarity to improve response quality from providers.',
    tag: 'Tips',
    publishedAt: '2026-03-06',
    readMinutes: 4,
    content: (
      <>
        <p>
          Getting great quotes starts long before a provider submits their offer — it starts with how
          you write your task post. A well-structured post sets expectations clearly, attracts
          experienced providers, and reduces back-and-forth messages before work even begins.
        </p>

        <h2>1. Write a specific title</h2>
        <p>
          Vague titles like &ldquo;Need plumber&rdquo; or &ldquo;Help with garden&rdquo; result in fewer, lower-quality
          responses. Instead, try: <em>&ldquo;Leaking kitchen tap &mdash; needs repair, Drumcondra, Dublin 9&rdquo;</em>{' '}
          or <em>&ldquo;Rear garden lawn cut and hedge trim, 3-bed semi, Galway&rdquo;</em>. Specificity signals
          that you know what you need and that you are a serious customer.
        </p>

        <h2>2. Describe scope clearly</h2>
        <p>
          Break the job into bullet points where possible. Include dimensions, quantities, access
          details, and any special requirements. If a painter needs to know that ceilings are 3m high
          and there is no ladder on site, say so upfront. Providers price more accurately — and more
          competitively — when they have the full picture.
        </p>

        <h2>3. State your budget honestly</h2>
        <p>
          Customers who select a realistic budget range receive 2–3× more quotes than those who leave
          it blank. You do not need to anchor at the bottom of your range. Setting a fair budget
          signals willingness to pay for quality and filters out providers who cannot deliver within
          it. WorkMate&apos;s secure payment hold means you only release funds when satisfied, so the risk
          of overpaying is low.
        </p>

        <h2>4. Indicate urgency accurately</h2>
        <p>
          Mark a job urgent only when it is genuinely urgent. Providers prioritise urgent jobs, but if
          the timeline is flexible, saying so can attract better-considered offers from providers who
          are not currently overbooked. &ldquo;Flexible &mdash; within the next 2 weeks&rdquo; is more useful than
          &ldquo;ASAP&rdquo; when you actually have time.
        </p>

        <h2>5. Include photos where relevant</h2>
        <p>
          A single photo of a broken tile, an overgrown hedge, or a damp patch is worth dozens of
          words of description. Providers who can see the job before quoting are more confident in
          their price, and that confidence shows in the quality of the offer.
        </p>

        <h2>6. Respond to quote questions promptly</h2>
        <p>
          Top-rated providers on WorkMate often send a quick clarifying question before committing to
          a price. Customers who respond within a few hours close jobs at a significantly higher rate
          than those who wait days. Enable notifications so you can respond on the go.
        </p>

        <p>
          Following these steps consistently will not just get you more quotes — it will get you
          better ones, from providers who understand your needs and are genuinely motivated to win the
          job.
        </p>
      </>
    ),
  },
  {
    slug: 'secure-payments-explained',
    title: 'Secure payment flow explained for customers and providers',
    summary: 'A simple guide to platform payment states, release timing, and dispute-safe evidence.',
    tag: 'Payments',
    publishedAt: '2026-03-04',
    readMinutes: 5,
    content: (
      <>
        <p>
          WorkMate&apos;s payment system is built around a secure hold model: customers pay before work
          starts, funds are held safely, and providers receive payment only after the customer
          confirms the job is done. Here&apos;s how each stage works and what it means for both sides.
        </p>

        <h2>Stage 1 — Payment authorisation (hold)</h2>
        <p>
          When a customer accepts a provider&apos;s offer, they are prompted to confirm payment. At this
          point, the agreed amount is{' '}
          <strong>authorised (held)</strong> on their card — meaning the funds are reserved but not
          yet charged. The provider can see the job has a confirmed payment and can begin work
          confidently.
        </p>
        <p>
          Nothing is taken from the customer&apos;s account yet. The hold typically appears on a bank
          statement as a pending transaction.
        </p>

        <h2>Stage 2 — Work in progress</h2>
        <p>
          Both parties agree on timing and access. For time-tracked jobs, the provider uses the
          WorkMate timer to log hours worked. For fixed-price jobs, the provider completes the
          deliverables and marks the job as done.
        </p>

        <h2>Stage 3 — Customer approval and fund release</h2>
        <p>
          Once the provider marks the job complete, the customer receives a notification to review and
          release payment. When the customer approves, funds are{' '}
          <strong>captured</strong> (charged) and transferred to the provider&apos;s connected Stripe
          account, minus the platform commission.
        </p>
        <p>
          If the customer does not respond within the auto-release window (default: 48 hours after
          completion), funds are released automatically to protect the provider.
        </p>

        <h2>Stage 4 — Payouts to providers</h2>
        <p>
          Providers receive earnings directly to their bank account via Stripe Connect. Payout timing
          depends on the provider&apos;s Stripe account country and settings &mdash; typically 2&ndash;7 business days
          for Irish bank accounts.
        </p>

        <h2>What if something goes wrong?</h2>
        <p>
          Either party can open a dispute at any point during the job. Disputes pause automatic
          release and route the case to the WorkMate resolution team. To protect yourself in a
          dispute:
        </p>
        <ul>
          <li>Customers: keep message records, photos before and after, and signed-off job notes.</li>
          <li>
            Providers: use the WorkMate messaging system (not WhatsApp) so all communication is
            logged on platform.
          </li>
        </ul>
        <p>
          Disputes are reviewed within 7 days. Resolution team decisions are final for jobs
          under €500; escalation to a senior reviewer is available for larger amounts.
        </p>

        <h2>Platform fees</h2>
        <p>
          WorkMate charges a tiered commission on each completed job. The commission is deducted from
          the provider&apos;s earnings before payout. Customers pay the quoted price in full &mdash; there are no
          booking fees on the customer side.
        </p>
      </>
    ),
  },
  {
    slug: 'verification-roadmap',
    title: 'What verification status means in WorkMate',
    summary:
      'Understand pending, approved, and rejected document states with next-step recommendations.',
    tag: 'Security',
    publishedAt: '2026-03-01',
    readMinutes: 4,
    content: (
      <>
        <p>
          WorkMate operates an identity and credential verification process for all service providers.
          Verification builds trust with customers and unlocks full platform access. Here is what
          each status means and what to do if you are stuck.
        </p>

        <h2>Why verification matters</h2>
        <p>
          Customers on WorkMate are hiring someone to enter their home or business. A verified badge
          signals that the provider has submitted identity documentation and that it has been reviewed
          by the WorkMate team. Unverified providers can still quote on jobs, but verified providers
          rank higher in results and convert at a higher rate.
        </p>

        <h2>Document states</h2>

        <h3>Pending review</h3>
        <p>
          Your document has been uploaded and is in the review queue. Review typically takes 1–2
          business days. You will receive an email notification when a decision is made. No action is
          needed on your part — check that your notification settings are on so you do not miss the
          update.
        </p>

        <h3>Approved</h3>
        <p>
          The document was reviewed and accepted. Your profile will display the relevant verification
          badge and your ranking will improve in search results. Approved documents do not expire on
          WorkMate, but if a professional licence renews, you should upload the renewed version to
          maintain your badge.
        </p>

        <h3>Rejected</h3>
        <p>
          The document was not accepted. Common reasons include: image too blurry, document expired,
          name on document does not match profile, or wrong document type uploaded. The rejection
          email will include a specific reason. You can upload a corrected version immediately from
          your profile — there is no waiting period between attempts.
        </p>

        <h2>Identity verification via Stripe Identity</h2>
        <p>
          Stripe Identity is used for government-issued ID checks (passport or driving licence). The
          process is handled entirely by Stripe — WorkMate does not store images of your ID. Stripe
          processes your document and returns a verified or requires-input result.
        </p>
        <p>
          If Stripe returns <em>requires input</em>, it usually means the document image was
          insufficient or the selfie did not match. You can retry the Stripe Identity flow from your
          provider profile at any time.
        </p>

        <h2>Tips for a smooth verification</h2>
        <ul>
          <li>Use a phone camera in good lighting — avoid glare on laminated documents.</li>
          <li>Ensure the full document is visible including all four corners.</li>
          <li>Make sure the document is not expired.</li>
          <li>
            For trade licences, upload the most recent certificate showing your registration number.
          </li>
        </ul>

        <p>
          If your document has been pending for more than 3 business days, contact WorkMate support
          via the contact page with your profile ID and document type.
        </p>
      </>
    ),
  },
  {
    slug: 'provider-dashboard-updates',
    title: 'Provider dashboard updates and task alert improvements',
    summary:
      'Recent UI and matching updates to help providers discover relevant jobs faster.',
    tag: 'Product',
    publishedAt: '2026-02-28',
    readMinutes: 3,
    content: (
      <>
        <p>
          We have shipped a set of updates to the provider dashboard and task alert system to make it
          easier to find and respond to relevant jobs quickly.
        </p>

        <h2>Drag-and-drop widget layout</h2>
        <p>
          The provider dashboard now supports a fully customisable widget grid. You can add, remove,
          and reorder widgets by dragging them to the layout that works best for your workflow. Your
          layout is saved automatically and persists across devices.
        </p>
        <p>
          Default widgets include: Earnings summary, Active jobs, Pending quotes, Task alerts,
          Subscription status, Profile completeness, Availability calendar, and Work gallery.
        </p>

        <h2>Task alert improvements</h2>
        <p>
          Task alerts now use a smarter matching engine. When you create an alert with a service
          category, Eircode, and radius, the system evaluates every new job posting against your
          criteria within seconds. You will only receive an alert if:
        </p>
        <ul>
          <li>The job category matches one of your listed services.</li>
          <li>The job location falls within your specified radius.</li>
          <li>The job status is active and accepting quotes.</li>
        </ul>
        <p>
          False positives (alerts for jobs you cannot service) have been significantly reduced in
          this release.
        </p>

        <h2>Profile completeness widget</h2>
        <p>
          A new profile completeness widget shows a percentage score and a checklist of items that,
          when completed, improve your ranking in job results. The most impactful steps are: uploading
          a profile photo, adding portfolio items, getting your first review, and completing identity
          verification.
        </p>

        <h2>Availability calendar</h2>
        <p>
          You can now block out unavailable dates directly from the dashboard widget. Blocked dates
          are visible to customers when they browse your public profile, reducing quote requests for
          dates you cannot fulfil.
        </p>

        <h2>Earnings &amp; payouts page</h2>
        <p>
          A dedicated earnings page is now available under the provider dashboard. It shows a full
          transaction history with date, job, customer name, gross and net amount, and payment status.
          Filter by date range or payment status to reconcile earnings for a given period.
        </p>

        <p>
          These changes are live for all verified providers. If you have feedback or a feature
          request, use the &ldquo;Suggest a topic&rdquo; link on the blog page or contact us directly.
        </p>
      </>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Static params                                                       */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ locale: 'en', slug: a.slug }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                            */
/* ------------------------------------------------------------------ */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return { title: 'Not Found' };
  return {
    title: `${article.title} — WorkMate Blog`,
    description: article.summary,
  };
}

/* ------------------------------------------------------------------ */
/*  Page component                                                      */
/* ------------------------------------------------------------------ */

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back link */}
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: 'var(--wm-primary)' }}
        >
          <ArrowLeft size={15} />
          Back to Blog
        </Link>

        {/* Article header */}
        <Card className="rounded-3xl">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-widest">
            <span
              className="inline-flex items-center gap-1"
              style={{ color: 'var(--wm-primary)' }}
            >
              <Tag size={11} />
              {article.tag}
            </span>
            <span style={{ color: 'var(--wm-subtle)' }}>·</span>
            <span
              className="inline-flex items-center gap-1"
              style={{ color: 'var(--wm-muted)' }}
            >
              <Clock size={11} />
              {article.readMinutes} min read
            </span>
            <span style={{ color: 'var(--wm-subtle)' }}>·</span>
            <span style={{ color: 'var(--wm-muted)' }}>{publishedDate}</span>
          </div>

          <h1
            className="mt-4 text-2xl font-bold sm:text-3xl"
            style={{
              fontFamily: 'var(--wm-font-display)',
              color: 'var(--wm-navy)',
              lineHeight: 1.25,
            }}
          >
            {article.title}
          </h1>

          <p className="mt-3 text-base leading-relaxed" style={{ color: 'var(--wm-muted)' }}>
            {article.summary}
          </p>
        </Card>

        {/* Article body */}
        <Card className="rounded-3xl">
          <div
            className="prose-wm space-y-5 text-base leading-relaxed"
            style={{ color: 'var(--wm-text-default)' }}
          >
            {article.content}
          </div>
        </Card>

        {/* Related articles */}
        <section>
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-widest"
            style={{ color: 'var(--wm-muted)' }}
          >
            More articles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ARTICLES.filter((a) => a.slug !== slug)
              .slice(0, 2)
              .map((related) => (
                <Card key={related.slug} className="rounded-2xl">
                  <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--wm-subtle)' }}>
                    {related.tag}
                  </p>
                  <h3
                    className="mt-1.5 text-base font-semibold"
                    style={{ color: 'var(--wm-navy)', fontFamily: 'var(--wm-font-display)' }}
                  >
                    {related.title}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: 'var(--wm-muted)' }}>
                    {related.summary}
                  </p>
                  <div className="mt-3">
                    <Button href={`/${locale}/blog/${related.slug}`} variant="ghost" size="sm">
                      Read article →
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Button href={`/${locale}/blog`} variant="secondary">
            View all articles
          </Button>
        </div>
      </div>
    </main>
  );
}
