/**
 * useLoading Hook
 *
 * Generic loading state management
 */

import { useState, useCallback } from 'react';
import { UseLoadingReturn } from '../types/generic';

export function useLoading(initialState = false): UseLoadingReturn {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  const withLoading = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      try {
        return await fn();
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { isLoading, startLoading, stopLoading, withLoading };
}
