import { getSupabaseServiceClient } from '@/lib/supabase/service';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Shell from '@/components/ui/Shell';
import StatCard from '@/components/ui/StatCard';

type ProviderRow = {
  id: string;
  full_name: string | null;
  verification_status: string;
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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = getSupabaseServiceClient();

  const { data: providersData, error: providersError } = await supabase
    .from('profiles')
    .select('id,full_name,verification_status,created_at')
    .eq('is_verified', true)
    .order('created_at', { ascending: false })
    .limit(100);

  const providers = (providersData ?? []) as ProviderRow[];
  const providerIds = providers.map((item) => item.id);

  const [{ data: servicesData }, { data: areasData }, { data: categoriesData }] = await Promise.all([
    providerIds.length
      ? supabase.from('pro_services').select('profile_id,category_id').in('profile_id', providerIds)
      : Promise.resolve({ data: [] as ProviderServiceRow[] }),
    providerIds.length
      ? supabase.from('pro_service_areas').select('profile_id,county').in('profile_id', providerIds)
      : Promise.resolve({ data: [] as ProviderAreaRow[] }),
    supabase.from('categories').select('id,name'),
  ]);

  const services = (servicesData ?? []) as ProviderServiceRow[];
  const areas = (areasData ?? []) as ProviderAreaRow[];
  const categories = (categoriesData ?? []) as CategoryRow[];

  const categoryNameById = new Map(categories.map((item) => [item.id, item.name]));

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
        <div className="mt-4 grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="rounded-2xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3>{provider.full_name ?? 'Provider'}</h3>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800">
                  Verified
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Services: {(servicesByProvider.get(provider.id) ?? []).join(', ') || '-'}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Areas: {(areasByProvider.get(provider.id) ?? []).join(', ') || '-'}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Joined: {new Date(provider.created_at).toLocaleDateString()}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button href={`/${locale}/post-job?mode=direct_request&provider_id=${provider.id}`} variant="primary">
                  Direct Request
                </Button>
                <Button href={`/${locale}/profile/public/${provider.id}`} variant="secondary">
                  View public profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
        {providers.length === 0 ? (
          <Card className="mt-4">
            <h3>No verified providers yet</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Try again later or create a public job request to collect general quotes.
            </p>
            <div className="mt-3">
              <Button href={`/${locale}/post-job`} variant="primary">
                Create job request
              </Button>
            </div>
          </Card>
        ) : null}
      </section>
    </Shell>
  );
}
