/**
 * Store Types
 *
 * Types for generic store factory
 */

import { BaseEntity, CrudState, CrudActions } from '../../types/generic';

/**
 * Extended store state with computed properties
 */
export interface GenericStoreState<T extends BaseEntity> extends CrudState<T> {
  itemsById: Record<string, T>;
  itemCount: number;
}

/**
 * Extended store actions
 */
export interface GenericStoreActions<T extends BaseEntity>
  extends CrudActions<T> {
  // Batch operations
  setItems: (items: T[]) => void;
  addItems: (items: T[]) => void;
  updateItems: (updates: Array<{ id: string; data: Partial<T> }>) => void;
  removeItems: (ids: string[]) => void;

  // Query operations
  getById: (id: string) => T | undefined;
  findBy: (predicate: (item: T) => boolean) => T[];
  sortBy: (key: keyof T, order?: 'asc' | 'desc') => T[];

  // Sync operations
  setSyncing: (syncing: boolean) => void;
  setUnsubscribe: (unsubscribe: (() => void) | null) => void;
  cleanup: () => void;
}

/**
 * Combined store type
 */
export type GenericStore<T extends BaseEntity> = GenericStoreState<T> &
  GenericStoreActions<T>;

/**
 * Store creation options
 */
export interface CreateStoreOptions<T extends BaseEntity> {
  name: string;
  persist?: boolean;
  initialState?: Partial<GenericStoreState<T>>;
}
