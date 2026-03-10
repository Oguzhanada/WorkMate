import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import ComplianceBadge from '@/components/ui/ComplianceBadge';
import FavouriteButton from '@/components/providers/FavouriteButton';

export const metadata: Metadata = {
  title: 'Saved Providers',
  description: 'Your saved service providers on WorkMate.',
};

export default async function SavedProvidersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const authClient = await getSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const supabase = getSupabaseServiceClient();

  const { data: favourites } = await supabase
    .from('favourite_providers')
    .select('provider_id,created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false });

  const providerIds = (favourites ?? []).map((f) => f.provider_id);

  const [{ data: profilesData }, { data: rankingsData }] = providerIds.length
    ? await Promise.all([
        supabase
          .from('profiles')
          .select('id,full_name,avatar_url,compliance_score,verification_status')
          .in('id', providerIds),
        supabase
          .from('provider_rankings')
          .select('provider_id,avg_rating,review_count,completed_jobs')
          .in('provider_id', providerIds),
      ])
    : [{ data: [] }, { data: [] }];

  type ProfileRow = { id: string; full_name: string | null; avatar_url: string | null; compliance_score: number; verification_status: string };
  type RankingRow = { provider_id: string; avg_rating: number; review_count: number; completed_jobs: number };

  const profiles = (profilesData ?? []) as ProfileRow[];
  const rankings = (rankingsData ?? []) as RankingRow[];
  const rankingById = new Map(rankings.map((r) => [r.provider_id, r]));

  // Preserve favourited order
  const orderedProfiles = providerIds
    .map((pid) => profiles.find((p) => p.id === pid))
    .filter(Boolean) as ProfileRow[];

  return (
    <Shell
      header={
        <PageHeader
          title="Saved Providers"
          description="Providers you've saved for quick access and re-booking."
        />
      }
    >
      {orderedProfiles.length === 0 ? (
        <Card>
          <EmptyState
            title="No saved providers yet"
            description="Browse the provider directory and tap the heart icon to save providers you like."
            action={
              <Button href={`/${locale}/providers`} variant="primary">
                Browse providers
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orderedProfiles.map((provider) => {
            const ranking = rankingById.get(provider.id);
            return (
              <Card key={provider.id} className="flex flex-col justify-between transition-shadow hover:shadow-[var(--wm-shadow-lg)]">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3
                      className="text-base font-semibold"
                      style={{ fontFamily: 'var(--wm-font-display)', color: 'var(--wm-navy)' }}
                    >
                      {provider.full_name ?? 'Provider'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <ComplianceBadge score={provider.compliance_score} />
                      {provider.verification_status === 'verified' ? (
                        <Badge tone="completed">Verified</Badge>
                      ) : null}
                      <FavouriteButton providerId={provider.id} initialSaved={true} />
                    </div>
                  </div>
                  {ranking ? (
                    <p className="mt-2 text-sm" style={{ color: 'var(--wm-muted)' }}>
                      {Number(ranking.avg_rating).toFixed(1)} stars &middot; {ranking.review_count} reviews &middot; {ranking.completed_jobs} jobs done
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    href={`/${locale}/post-job?mode=direct_request&provider_id=${provider.id}`}
                    variant="primary"
                    size="sm"
                  >
                    Direct Request
                  </Button>
                  <Button
                    href={`/${locale}/profile/public/${provider.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    View profile
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
