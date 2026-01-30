/**
 * Generic Hooks Index
 *
 * Re-exports all generic hooks
 */

// Async & Loading
export { useAsync } from './useAsync';
export type { UseAsyncOptions } from './useAsync';

export { useLoading } from './useLoading';

// Pagination
export { usePagination } from './usePagination';
export type { UsePaginationOptions } from './usePagination';

// Timing
export { useDebounce, useDebouncedCallback } from './useDebounce';
export { useThrottle } from './useThrottle';

// State utilities
export { useToggle } from './useToggle';
export { usePrevious } from './usePrevious';
export { useMemoCompare } from './useMemoCompare';

// Collections
export { useArray } from './useArray';
export type { UseArrayReturn } from './useArray';

export { useMap } from './useMap';
export type { UseMapReturn } from './useMap';
