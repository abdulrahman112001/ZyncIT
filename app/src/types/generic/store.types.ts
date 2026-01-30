/**
 * Store Generic Types
 */

/**
 * Base state for all stores
 */
export interface BaseState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Generic list state for stores with collections
 */
export interface ListState<T> extends BaseState {
  items: T[];
  selectedItem: T | null;
}

/**
 * Generic CRUD state
 */
export interface CrudState<T> extends ListState<T> {
  isSyncing: boolean;
  unsubscribe: (() => void) | null;
}

/**
 * Generic CRUD actions
 */
export interface CrudActions<
  T,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> {
  setItems: (items: T[]) => void;
  addItem: (item: T) => void;
  updateItem: (id: string, updates: UpdateInput) => void;
  removeItem: (id: string) => void;
  setSelectedItem: (item: T | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

/**
 * Combined CRUD store type
 */
export type CrudStore<
  T,
  CreateInput = Partial<T>,
  UpdateInput = Partial<T>,
> = CrudState<T> & CrudActions<T, CreateInput, UpdateInput>;
