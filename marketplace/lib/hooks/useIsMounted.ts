'use client';

import { useEffect, useRef } from 'react';

/**
 * Returns a ref whose `.current` is true only after the component has mounted.
 * Use to safely guard client-only code and avoid SSR/hydration mismatches.
 */
export function useIsMounted(): React.RefObject<boolean> {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}
