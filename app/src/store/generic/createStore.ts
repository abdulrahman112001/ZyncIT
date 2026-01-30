/**
 * Store Factory
 *
 * Creates type-safe Zustand stores with common CRUD operations
 */

import { create, StateCreator } from 'zustand';
import { persist, PersistOptions } from 'zustand/middleware';
import { BaseEntity } from '../../types/generic';
import {
  GenericStore,
  GenericStoreState,
  CreateStoreOptions,
} from './storeTypes';

/**
 * Creates a generic CRUD store with common operations
 */
export function createGenericStore<T extends BaseEntity>(
  options: CreateStoreOptions<T>,
): ReturnType<typeof create<GenericStore<T>>> {
  const { name, persist: shouldPersist = false, initialState = {} } = options;

  const defaultState: GenericStoreState<T> = {
    items: [],
    selectedItem: null,
    isLoading: false,
    isSyncing: false,
    error: null,
    unsubscribe: null,
    itemsById: {},
    itemCount: 0,
    ...initialState,
  };

  const storeCreator: StateCreator<GenericStore<T>> = (set, get) => ({
    ...defaultState,

    // Basic setters
    setItems: (items: T[]) => {
      const itemsById = items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<string, T>);
      set({ items, itemsById, itemCount: items.length });
    },

    addItem: (item: T) => {
      const { items, itemsById } = get();
      if (itemsById[item.id]) return;

      const newItems = [item, ...items];
      const newItemsById = { ...itemsById, [item.id]: item };
      set({
        items: newItems,
        itemsById: newItemsById,
        itemCount: newItems.length,
      });
    },

    addItems: (newItems: T[]) => {
      const { items, itemsById } = get();
      const uniqueNewItems = newItems.filter(item => !itemsById[item.id]);
      if (uniqueNewItems.length === 0) return;

      const updatedItems = [...uniqueNewItems, ...items];
      const updatedItemsById = uniqueNewItems.reduce(
        (acc, item) => {
          acc[item.id] = item;
          return acc;
        },
        { ...itemsById },
      );
      set({
        items: updatedItems,
        itemsById: updatedItemsById,
        itemCount: updatedItems.length,
      });
    },

    updateItem: (id: string, updates: Partial<T>) => {
      const { items, itemsById, selectedItem } = get();
      const existingItem = itemsById[id];
      if (!existingItem) return;

      const updatedItem = {
        ...existingItem,
        ...updates,
        updatedAt: Date.now(),
      };
      const updatedItems = items.map(item =>
        item.id === id ? updatedItem : item,
      );
      const updatedItemsById = { ...itemsById, [id]: updatedItem };
      const updatedSelectedItem =
        selectedItem?.id === id ? updatedItem : selectedItem;

      set({
        items: updatedItems,
        itemsById: updatedItemsById,
        selectedItem: updatedSelectedItem,
      });
    },

    updateItems: (updates: Array<{ id: string; data: Partial<T> }>) => {
      const { items, itemsById, selectedItem } = get();
      const updateMap = new Map(updates.map(u => [u.id, u.data]));

      const updatedItems = items.map(item => {
        const update = updateMap.get(item.id);
        return update ? { ...item, ...update, updatedAt: Date.now() } : item;
      });

      const updatedItemsById = { ...itemsById };
      updates.forEach(({ id, data }) => {
        if (updatedItemsById[id]) {
          updatedItemsById[id] = {
            ...updatedItemsById[id],
            ...data,
            updatedAt: Date.now(),
          };
        }
      });

      const updatedSelectedItem =
        selectedItem && updateMap.has(selectedItem.id)
          ? { ...selectedItem, ...updateMap.get(selectedItem.id)! }
          : selectedItem;

      set({
        items: updatedItems,
        itemsById: updatedItemsById,
        selectedItem: updatedSelectedItem,
      });
    },

    removeItem: (id: string) => {
      const { items, itemsById, selectedItem } = get();
      const { [id]: removed, ...remainingItemsById } = itemsById;
      const remainingItems = items.filter(item => item.id !== id);
      const updatedSelectedItem = selectedItem?.id === id ? null : selectedItem;

      set({
        items: remainingItems,
        itemsById: remainingItemsById,
        itemCount: remainingItems.length,
        selectedItem: updatedSelectedItem,
      });
    },

    removeItems: (ids: string[]) => {
      const { items, itemsById, selectedItem } = get();
      const idsSet = new Set(ids);
      const remainingItems = items.filter(item => !idsSet.has(item.id));
      const remainingItemsById = Object.fromEntries(
        Object.entries(itemsById).filter(([id]) => !idsSet.has(id)),
      );
      const updatedSelectedItem =
        selectedItem && idsSet.has(selectedItem.id) ? null : selectedItem;

      set({
        items: remainingItems,
        itemsById: remainingItemsById,
        itemCount: remainingItems.length,
        selectedItem: updatedSelectedItem,
      });
    },

    setSelectedItem: (item: T | null) => set({ selectedItem: item }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),
    setSyncing: (isSyncing: boolean) => set({ isSyncing }),
    setUnsubscribe: (unsubscribe: (() => void) | null) => set({ unsubscribe }),

    // Query operations
    getById: (id: string) => get().itemsById[id],

    findBy: (predicate: (item: T) => boolean) => get().items.filter(predicate),

    sortBy: (key: keyof T, order: 'asc' | 'desc' = 'desc') => {
      const { items } = get();
      return [...items].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    },

    reset: () => {
      const { unsubscribe } = get();
      if (unsubscribe) unsubscribe();
      set(defaultState);
    },

    cleanup: () => {
      const { unsubscribe } = get();
      if (unsubscribe) {
        unsubscribe();
        set({ unsubscribe: null });
      }
    },
  });

  if (shouldPersist) {
    const persistOptions: PersistOptions<
      GenericStore<T>,
      Partial<GenericStore<T>>
    > = {
      name: `iropit-${name}`,
      partialize: state => ({
        items: state.items,
        itemsById: state.itemsById,
        itemCount: state.itemCount,
      }),
    };
    return create(persist(storeCreator, persistOptions));
  }

  return create(storeCreator);
}
