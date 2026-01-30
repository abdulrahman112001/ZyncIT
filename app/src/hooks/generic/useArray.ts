/**
 * useArray Hook
 *
 * Array state management with utility methods
 */

import { useState, useCallback } from 'react';

export interface UseArrayReturn<T> {
  value: T[];
  push: (item: T) => void;
  remove: (index: number) => void;
  removeById: (id: string) => void;
  update: (index: number, item: T) => void;
  filter: (predicate: (item: T) => boolean) => void;
  clear: () => void;
  set: (items: T[]) => void;
}

export function useArray<T extends { id?: string }>(
  initialValue: T[] = [],
): UseArrayReturn<T> {
  const [value, setValue] = useState(initialValue);

  const push = useCallback((item: T) => {
    setValue(arr => [...arr, item]);
  }, []);

  const remove = useCallback((index: number) => {
    setValue(arr => arr.filter((_, i) => i !== index));
  }, []);

  const removeById = useCallback((id: string) => {
    setValue(arr => arr.filter(item => item.id !== id));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setValue(arr => arr.map((v, i) => (i === index ? item : v)));
  }, []);

  const filter = useCallback((predicate: (item: T) => boolean) => {
    setValue(arr => arr.filter(predicate));
  }, []);

  const clear = useCallback(() => setValue([]), []);

  const set = useCallback((items: T[]) => setValue(items), []);

  return { value, push, remove, removeById, update, filter, clear, set };
}
