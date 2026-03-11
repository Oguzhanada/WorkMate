import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceClient } from '@/lib/supabase/service';
import Shell from '@/components/ui/Shell';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import SavedSearchesList from '@/components/providers/SavedSearchesList';

export const metadata = {
  title: 'Saved Searches | WorkMate',
  description: 'Manage your saved provider searches and notification preferences.',
};

type SavedSearchFilters = {
  category_id?:   string;
  county?:        string;
  min_rate?:      number;
  max_rate?:      number;
  verified_only?: boolean;
};

type SavedSearch = {
  id:               string;
  name:             string;
  filters:          SavedSearchFilters;
  notify_email:     boolean;
  notify_bell:      boolean;
  last_notified_at: string | null;
  created_at:       string;
};

export default async function SavedSearchesPage({
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

  const [{ data: searchesData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from('saved_searches')
      .select('id,name,filters,notify_email,notify_bell,last_notified_at,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id,name'),
  ]);

  const searches = (searchesData ?? []) as SavedSearch[];
  const categories = (categoriesData ?? []) as { id: string; name: string }[];
  const categoryNameById = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <Shell
      header={
        <PageHeader
          title="Saved Searches"
          description="Save your favourite provider search criteria and get notified when new matches appear."
        />
      }
    >
      {searches.length === 0 ? (
        <Card>
          <EmptyState
            title="No saved searches yet"
            description="Run a search on the provider directory and click 'Save search' to save your filters here."
            action={
              <Button href={`/${locale}/providers`} variant="primary">
                Browse providers
              </Button>
            }
          />
        </Card>
      ) : (
        <SavedSearchesList
          initialSearches={searches}
          locale={locale}
          categoryNameById={categoryNameById}
        />
      )}
    </Shell>
  );
}
