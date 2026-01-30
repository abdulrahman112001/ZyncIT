/**
 * Hook Return Generic Types
 */

/**
 * Generic loading state hook return
 */
export interface UseLoadingReturn {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

/**
 * Generic async state hook return
 */
export interface UseAsyncReturn<T, E = Error> {
  data: T | null;
  error: E | null;
  isLoading: boolean;
  execute: () => Promise<void>;
  reset: () => void;
}

/**
 * Generic pagination hook return
 */
export interface UsePaginationReturn<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  page: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}
