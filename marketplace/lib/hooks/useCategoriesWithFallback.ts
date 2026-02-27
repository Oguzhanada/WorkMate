'use client';

import {useEffect, useMemo, useState} from 'react';

import {getTaxonomyCategories} from '@/lib/service-taxonomy';

export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

type Options = {
  leafOnly?: boolean;
  fallbackNotice?: string;
};

const DEFAULT_NOTICE = 'Service categories are temporarily unavailable. Showing fallback options.';

export function useCategoriesWithFallback(options: Options = {}) {
  const {leafOnly = true, fallbackNotice = DEFAULT_NOTICE} = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  const fallbackCategories = useMemo(() => {
    const all = getTaxonomyCategories() as Category[];
    if (!leafOnly) return all;
    return all.filter((item) => item.parent_id !== null);
  }, [leafOnly]);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/categories', {cache: 'no-store'});
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error('Categories API request failed.');
        }

        const all = (payload.categories ?? []) as Category[];
        const leafRows = all.filter((item) => item.parent_id !== null);
        const selectableFromApi = leafOnly ? (leafRows.length > 0 ? leafRows : all) : all;
        const resolved = selectableFromApi.length > 0 ? selectableFromApi : fallbackCategories;
        const fallbackUsed = selectableFromApi.length === 0;

        if (!active) return;
        setCategories(resolved);
        setIsFallback(fallbackUsed);
        setNotice(fallbackUsed || payload.warning ? fallbackNotice : '');
      } catch {
        if (!active) return;
        setCategories(fallbackCategories);
        setIsFallback(true);
        setNotice(fallbackNotice);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadCategories();

    return () => {
      active = false;
    };
  }, [fallbackCategories, fallbackNotice, leafOnly]);

  return {categories, isLoading, notice, isFallback};
}
