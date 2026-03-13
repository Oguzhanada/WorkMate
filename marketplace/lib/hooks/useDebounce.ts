'use client';

import { useEffect, useState } from 'react';

/**
 * Delays updating a value until after a specified delay has elapsed.
 * Use to debounce search inputs, API calls, and other rapid-fire events.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
