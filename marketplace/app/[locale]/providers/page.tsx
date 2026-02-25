import { getSupabaseServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import styles from '../inner.module.css';

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

export default async function ProvidersPage() {
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

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <article className={styles.card}>
          <h1>Provider Directory</h1>
          <p className={styles.muted}>
            Explore verified providers, their service categories and coverage areas.
          </p>
        </article>
      </section>

      <section className={styles.container}>
        {providersError ? (
          <div className={styles.error}>Providers could not be loaded: {providersError.message}</div>
        ) : null}
        <div className={styles.grid3}>
          {providers.map((provider) => (
            <article key={provider.id} className={styles.card}>
              <h3>{provider.full_name ?? 'Provider'}</h3>
              <p className={styles.muted}>Status: {provider.verification_status}</p>
              <p className={styles.muted}>
                Services: {(servicesByProvider.get(provider.id) ?? []).join(', ') || '-'}
              </p>
              <p className={styles.muted}>
                Areas: {(areasByProvider.get(provider.id) ?? []).join(', ') || '-'}
              </p>
              <p className={styles.muted}>
                Joined: {new Date(provider.created_at).toLocaleDateString()}
              </p>
              <div className={styles.actions}>
                <Link className={styles.primary} href={`/profile/public/${provider.id}`}>
                  View public profile
                </Link>
              </div>
            </article>
          ))}
        </div>
        {providers.length === 0 ? <p className={styles.muted}>No verified providers yet.</p> : null}
      </section>
    </main>
  );
}
