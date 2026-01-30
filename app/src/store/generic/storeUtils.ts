/**
 * Store Utilities
 *
 * Helper functions for store data manipulation
 */

import { BaseEntity } from '../../types/generic';

/**
 * Merge items keeping the newest version
 */
export function mergeItems<T extends BaseEntity & { timestamp?: number }>(
  existing: T[],
  incoming: T[],
): T[] {
  const merged = new Map<string, T>();

  existing.forEach(item => merged.set(item.id, item));

  incoming.forEach(item => {
    const existingItem = merged.get(item.id);
    if (
      !existingItem ||
      (item.timestamp || 0) > (existingItem.timestamp || 0)
    ) {
      merged.set(item.id, item);
    }
  });

  return Array.from(merged.values());
}

/**
 * Deduplicate items by ID
 */
export function deduplicateItems<T extends BaseEntity>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Group items by a key
 */
export function groupItemsBy<T, K extends keyof T>(
  items: T[],
  key: K,
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Sort items by timestamp (newest first)
 */
export function sortByTimestamp<T extends { timestamp?: number }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc',
): T[] {
  return [...items].sort((a, b) => {
    const diff = (b.timestamp || 0) - (a.timestamp || 0);
    return order === 'desc' ? diff : -diff;
  });
}

/**
 * Filter items by date range
 */
export function filterByDateRange<T extends { timestamp?: number }>(
  items: T[],
  startDate: number,
  endDate: number,
): T[] {
  return items.filter(item => {
    const timestamp = item.timestamp || 0;
    return timestamp >= startDate && timestamp <= endDate;
  });
}

/**
 * Search items by text field
 */
export function searchItems<T>(
  items: T[],
  searchText: string,
  fields: (keyof T)[],
): T[] {
  const lowerSearch = searchText.toLowerCase();
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerSearch);
      }
      return false;
    }),
  );
}
