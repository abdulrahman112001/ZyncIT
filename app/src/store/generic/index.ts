/**
 * Generic Store Index
 *
 * Re-exports all store utilities
 */

// Store Factory
export { createGenericStore } from './createStore';

// Store Types
export type {
  GenericStore,
  GenericStoreState,
  GenericStoreActions,
  CreateStoreOptions,
} from './storeTypes';

// Store Utilities
export {
  mergeItems,
  deduplicateItems,
  groupItemsBy,
  sortByTimestamp,
  filterByDateRange,
  searchItems,
} from './storeUtils';
