'use client';

import { useState } from 'react';
import SavedSearchCard from '@/components/providers/SavedSearchCard';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

type SavedSearchFilters = {
  category_id?:   string;
  county?:        string;
  min_rate?:      number;
  max_rate?:      number;
  verified_only?: boolean;
  garda_vetted?:  boolean;
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

type Props = {
  initialSearches:  SavedSearch[];
  locale:           string;
  categoryNameById: Record<string, string>;
};

export default function SavedSearchesList({ initialSearches, locale, categoryNameById }: Props) {
  const [searches, setSearches] = useState<SavedSearch[]>(initialSearches);

  const handleDeleted = (id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  };

  if (searches.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No saved searches"
          description="All your saved searches have been removed. Browse providers to create a new one."
          action={
            <Button href={`/${locale}/providers`} variant="primary">
              Browse providers
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {searches.map((search) => (
        <SavedSearchCard
          key={search.id}
          search={search}
          locale={locale}
          categoryNameById={categoryNameById}
          onDeleted={handleDeleted}
        />
      ))}
    </div>
  );
}
