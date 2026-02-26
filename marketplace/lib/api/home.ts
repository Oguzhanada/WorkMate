'use client';

import {useEffect, useState} from 'react';

export type FeaturedProvider = {
  id: string;
  full_name: string;
  profession: string;
  county: string;
  avatar_url: string | null;
  rating: number;
  review_count: number;
  verified: boolean;
};

type FeaturedProvidersResponse = {
  providers: FeaturedProvider[];
};

export async function fetchFeaturedProviders(signal?: AbortSignal): Promise<FeaturedProvider[]> {
  const response = await fetch('/api/home/featured-providers', {
    method: 'GET',
    cache: 'no-store',
    signal
  });

  if (!response.ok) {
    throw new Error('Featured providers could not be loaded');
  }

  const payload = (await response.json()) as FeaturedProvidersResponse;
  return payload.providers ?? [];
}

export function useFeaturedProviders() {
  const [providers, setProviders] = useState<FeaturedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetchFeaturedProviders(controller.signal)
      .then((data) => {
        setProviders(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if ((err as Error).name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return {providers, loading, error};
}
