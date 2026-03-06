import {notFound} from 'next/navigation';
import {getSupabaseServiceClient} from '@/lib/supabase/service';
import Button from '@/components/ui/Button';
import ComplianceBadge from '@/components/ui/ComplianceBadge';
import styles from '../../../inner.module.css';

type Params = Promise<{locale: string; id: string}>;

export default async function PublicProfilePage({params}: {params: Params}) {
  const {id} = await params;
  const supabase = getSupabaseServiceClient();

  const [{data: profile}, {data: jobsCount}, {data: services}, {data: areas}, {data: portfolio}] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id,full_name,avatar_url,created_at,is_verified,verification_status,compliance_score')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('jobs')
        .select('id')
        .eq('customer_id', id),
      supabase.from('pro_services').select('category_id').eq('profile_id', id),
      supabase.from('pro_service_areas').select('county').eq('profile_id', id),
      supabase
        .from('pro_portfolio')
        .select('id,title,before_image_url,after_image_url,experience_note,visibility_scope,created_at')
        .eq('profile_id', id)
        .eq('visibility_scope', 'public')
        .order('created_at', {ascending: false})
        .limit(8),
    ]);

  if (!profile) {
    notFound();
  }

  const categoryIds = Array.from(new Set((services ?? []).map((item) => item.category_id)));
  const {data: categories} = categoryIds.length
    ? await supabase.from('categories').select('id,name').in('id', categoryIds)
    : {data: [] as Array<{id: string; name: string}>};
  const nameById = new Map((categories ?? []).map((item) => [item.id, item.name]));
  const serviceNames = categoryIds.map((idValue) => nameById.get(idValue)).filter(Boolean);
  const areaNames = Array.from(new Set((areas ?? []).map((item) => item.county)));
  const tasksPosted = (jobsCount ?? []).length;

  return (
    <main className={styles.section}>
      <section className={styles.container}>
        <article className={styles.card}>
          <div className={styles.profileTopRow}>
            <div className={styles.actions}>
              <Button href="/providers" variant="ghost" size="sm">
                ← Back
              </Button>
            </div>
          </div>
          <div className={styles.profileTopRow}>
            <div className={styles.actions}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile avatar" style={{width: 96, height: 96, borderRadius: 999}} />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full border border-[var(--wm-border)] bg-[var(--wm-surface)] font-bold text-[var(--wm-text-muted)]">
                  {(profile.full_name ?? 'U')
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join('') || 'U'}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1>{profile.full_name ?? 'Member'}</h1>
                  <ComplianceBadge score={(profile as { compliance_score?: number }).compliance_score ?? 0} />
                </div>
                <p className={styles.muted}>Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
                <p className={styles.muted}>
                  Status: {profile.is_verified ? 'Verified' : profile.verification_status ?? 'Pending'}
                </p>
              </div>
            </div>
          </div>
          <div className={styles.grid3}>
            <div>
              <p className={styles.muted}>Tasks posted</p>
              <p>{tasksPosted}</p>
            </div>
            <div>
              <p className={styles.muted}>Services</p>
              <p>{serviceNames.length ? serviceNames.join(', ') : '-'}</p>
            </div>
            <div>
              <p className={styles.muted}>Service areas</p>
              <p>{areaNames.length ? areaNames.join(', ') : '-'}</p>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.container}>
        <article className={styles.card}>
          <h2>Public portfolio</h2>
          {(portfolio ?? []).length === 0 ? (
            <p className={styles.muted}>No public work samples yet.</p>
          ) : (
            <div className={styles.grid3}>
              {(portfolio ?? []).map((item) => (
                <article key={item.id} className={styles.card}>
                  <h3>{item.title || 'Work sample'}</h3>
                  <div className={styles.grid2}>
                    <img src={item.before_image_url} alt="Before" style={{width: '100%', borderRadius: 10}} />
                    <img src={item.after_image_url} alt="After" style={{width: '100%', borderRadius: 10}} />
                  </div>
                  {item.experience_note ? <p className={styles.muted}>{item.experience_note}</p> : null}
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
