import { getSupabaseServiceClient } from '@/lib/supabase/service';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Shell from '@/components/ui/Shell';
import StatCard from '@/components/ui/StatCard';

import ProviderFilterToggle from './ProviderFilterToggle';
import ComplianceBadge from '@/components/ui/ComplianceBadge';
import FavouriteButton from '@/components/providers/FavouriteButton';

type ProviderRow = {
  id: string;
  full_name: string | null;
  verification_status: string;
  compliance_score: number;
  created_at: string;
};

type ProviderServiceRow = {
  profile_id: string;
  category_id: string;
};

type ProviderAreaRow = {
  profile_id: string;
  county: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

export default async function ProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const locale = resolvedParams.locale;
  const isVerifiedOnly = resolvedSearch?.verified !== 'false';
  const supabase = getSupabaseServiceClient();

  // Fetch current user to show personalised favourite state
  const authClient = await getSupabaseServerClient();
  const { data: { user: currentUser } } = await authClient.auth.getUser();

  let query = supabase
    .from('profiles')
    .select('id,full_name,verification_status,compliance_score,created_at')
    .eq('is_verified', true);

  if (isVerifiedOnly) {
    query = query.gte('compliance_score', 80);
  }

  const { data: providersData, error: providersError } = await query
    .order('created_at', { ascending: false })
    .limit(100);

  const providers = (providersData ?? []) as ProviderRow[];
  const providerIds = providers.map((item) => item.id);

  const [{ data: servicesData }, { data: areasData }, { data: categoriesData }, { data: favouritesData }] = await Promise.all([
    providerIds.length
      ? supabase.from('pro_services').select('profile_id,category_id').in('profile_id', providerIds)
      : Promise.resolve({ data: [] as ProviderServiceRow[] }),
    providerIds.length
      ? supabase.from('pro_service_areas').select('profile_id,county').in('profile_id', providerIds)
      : Promise.resolve({ data: [] as ProviderAreaRow[] }),
    supabase.from('categories').select('id,name'),
    currentUser
      ? supabase
          .from('favourite_providers')
          .select('provider_id')
          .eq('customer_id', currentUser.id)
      : Promise.resolve({ data: [] as { provider_id: string }[] }),
  ]);

  const services = (servicesData ?? []) as ProviderServiceRow[];
  const areas = (areasData ?? []) as ProviderAreaRow[];
  const categories = (categoriesData ?? []) as CategoryRow[];

  const categoryNameById = new Map(categories.map((item) => [item.id, item.name]));
  const savedProviderIds = new Set((favouritesData ?? []).map((f) => f.provider_id));

  // Same-Day Available: providers with a recurring or specific slot for today
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay();
  const { data: sameDaySlots } = providerIds.length
    ? await supabase
        .from('provider_availability')
        .select('provider_id')
        .in('provider_id', providerIds)
        .or(`and(is_recurring.eq.true,day_of_week.eq.${todayDow}),and(is_recurring.eq.false,specific_date.eq.${todayDate})`)
    : { data: [] as { provider_id: string }[] };

  const sameDayProviderIds = new Set((sameDaySlots ?? []).map((row) => row.provider_id));

  const servicesByProvider = new Map<string, string[]>();
  for (const row of services) {
    const list = servicesByProvider.get(row.profile_id) ?? [];
    const name = categoryNameById.get(row.category_id);
    if (name && !list.includes(name)) list.push(name);
    servicesByProvider.set(row.profile_id, list);
  }

  const areasByProvider = new Map<string, string[]>();
  for (const row of areas) {
    const list = areasByProvider.get(row.profile_id) ?? [];
    if (!list.includes(row.county)) list.push(row.county);
    areasByProvider.set(row.profile_id, list);
  }

  const providersWithServices = providers.filter((provider) => (servicesByProvider.get(provider.id) ?? []).length > 0).length;
  const providersWithAreas = providers.filter((provider) => (areasByProvider.get(provider.id) ?? []).length > 0).length;

  return (
    <Shell
      header={
        <Card className="rounded-3xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1>Provider Directory</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Explore verified providers, their service categories and coverage areas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button href={`/${locale}/post-job`} variant="primary">
                Create job request
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCard label="Verified providers" value={providers.length} />
            <StatCard label="With service setup" value={providersWithServices} />
            <StatCard label="With area coverage" value={providersWithAreas} />
          </div>
        </Card>
      }
    >

      <section>
        {providersError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            Providers could not be loaded: {providersError.message}
          </div>
        ) : null}

        <div className="mb-4 flex items-center justify-end">
          <ProviderFilterToggle />
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <Card key={provider.id} className="flex flex-col justify-between transition-shadow hover:shadow-[var(--wm-shadow-lg)]">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {provider.full_name ?? 'Provider'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <ComplianceBadge score={provider.compliance_score} />
                    <Badge tone="completed">Verified</Badge>
                    {sameDayProviderIds.has(provider.id) ? (
                      <Badge tone="open">Same-Day Available</Badge>
                    ) : null}
                    {currentUser ? (
                      <FavouriteButton
                        providerId={provider.id}
                        initialSaved={savedProviderIds.has(provider.id)}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Services:</span>{' '}
                  {(servicesByProvider.get(provider.id) ?? []).join(', ') || 'Not set up'}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Areas:</span>{' '}
                  {(areasByProvider.get(provider.id) ?? []).join(', ') || 'Not set up'}
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Joined {new Date(provider.created_at).toLocaleDateString('en-IE')}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button href={`/${locale}/post-job?mode=direct_request&provider_id=${provider.id}`} variant="primary" size="sm">
                  Direct Request
                </Button>
                <Button href={`/${locale}/profile/public/${provider.id}`} variant="secondary" size="sm">
                  View profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {providers.length === 0 ? (
          <Card className="mt-4">
            <EmptyState
              title="No verified providers yet"
              description="Try again later or create a public job request to collect general quotes."
              action={
                <Button href={`/${locale}/post-job`} variant="primary">
                  Create job request
                </Button>
              }
            />
          </Card>
        ) : null}
      </section>
    </Shell>
  );
}
