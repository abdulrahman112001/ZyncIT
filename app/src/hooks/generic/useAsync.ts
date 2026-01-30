/**
 * useAsync Hook
 *
 * Generic async operation hook with loading and error states
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { UseAsyncReturn } from '../types/generic';

export interface UseAsyncOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: UseAsyncOptions<T> = {},
): UseAsyncReturn<T> & { execute: (...args: Args) => Promise<T | null> } {
  const { immediate = false, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFn(...args);
        if (isMounted.current) {
          setData(result);
          onSuccess?.(result);
        }
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isMounted.current) {
          setError(error);
          onError?.(error);
        }
        return null;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [asyncFn, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
  }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error, isLoading, execute, reset };
}
