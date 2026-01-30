/**
 * usePagination Hook
 *
 * Generic pagination with infinite scroll support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { UsePaginationReturn } from '../types/generic';

export interface UsePaginationOptions<T> {
  fetchFn: (
    page: number,
    limit: number,
  ) => Promise<{ items: T[]; hasMore: boolean }>;
  limit?: number;
  initialPage?: number;
}

export function usePagination<T>(
  options: UsePaginationOptions<T>,
): UsePaginationReturn<T> {
  const { fetchFn, limit = 20, initialPage = 1 } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await fetchFn(page, limit);
      if (isMounted.current) {
        setItems(prev => [...prev, ...result.items]);
        setHasMore(result.hasMore);
        setPage(p => p + 1);
      }
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, page, limit, isLoading, hasMore]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setPage(initialPage);
    try {
      const result = await fetchFn(initialPage, limit);
      if (isMounted.current) {
        setItems(result.items);
        setHasMore(result.hasMore);
        setPage(initialPage + 1);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, initialPage, limit]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setIsLoading(false);
  }, [initialPage]);

  return { items, isLoading, hasMore, page, loadMore, refresh, reset };
}
