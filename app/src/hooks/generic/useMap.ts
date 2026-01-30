/**
 * useMap Hook
 *
 * Map state management with utility methods
 */

import { useState, useCallback } from 'react';

export interface UseMapReturn<K, V> {
  value: Map<K, V>;
  set: (key: K, value: V) => void;
  remove: (key: K) => void;
  has: (key: K) => boolean;
  get: (key: K) => V | undefined;
  clear: () => void;
  reset: (entries?: [K, V][]) => void;
}

export function useMap<K, V>(
  initialEntries: [K, V][] = [],
): UseMapReturn<K, V> {
  const [map, setMap] = useState(new Map(initialEntries));

  const set = useCallback((key: K, value: V) => {
    setMap(prev => new Map(prev).set(key, value));
  }, []);

  const remove = useCallback((key: K) => {
    setMap(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  }, []);

  const has = useCallback((key: K) => map.has(key), [map]);
  const get = useCallback((key: K) => map.get(key), [map]);

  const clear = useCallback(() => setMap(new Map()), []);

  const reset = useCallback((entries: [K, V][] = []) => {
    setMap(new Map(entries));
  }, []);

  return { value: map, set, remove, has, get, clear, reset };
}
