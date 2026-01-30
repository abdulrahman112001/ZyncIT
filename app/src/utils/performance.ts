/**
 * iRopit Performance Utilities
 * Optimizations for better app performance
 */

/**
 * Debounce function - delays execution until after wait period
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastTime >= wait) {
      lastTime = now;
      func(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func(...args);
      }, wait - (now - lastTime));
    }
  };
}

/**
 * Batch updates - collects items and processes them in batches
 */
export class BatchProcessor<T> {
  private items: T[] = [];
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private processor: (items: T[]) => Promise<void>;
  private batchSize: number;
  private delay: number;

  constructor(
    processor: (items: T[]) => Promise<void>,
    options: { batchSize?: number; delay?: number } = {},
  ) {
    this.processor = processor;
    this.batchSize = options.batchSize || 50;
    this.delay = options.delay || 500;
  }

  add(item: T): void {
    this.items.push(item);

    // Process immediately if batch is full
    if (this.items.length >= this.batchSize) {
      this.flush();
      return;
    }

    // Schedule delayed processing
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.flush();
      }, this.delay);
    }
  }

  addMultiple(items: T[]): void {
    items.forEach(item => this.add(item));
  }

  async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.items.length === 0) return;

    const itemsToProcess = [...this.items];
    this.items = [];

    try {
      await this.processor(itemsToProcess);
    } catch (error) {
      // Re-add failed items
      this.items = [...itemsToProcess, ...this.items];
    }
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.items = [];
  }

  get pendingCount(): number {
    return this.items.length;
  }
}

/**
 * Memoization for expensive calculations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyResolver?: (...args: Parameters<T>) => string,
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory issues
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    return result;
  }) as T;
}

/**
 * Simple LRU Cache implementation
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // Evict oldest if at capacity
    else if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Deduplication helper for arrays
 */
export function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

/**
 * Merge and deduplicate two arrays by id, keeping newest by timestamp
 */
export function mergeByIdKeepNewest<
  T extends { id: string; timestamp?: number },
>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>();

  // Add existing items
  existing.forEach(item => map.set(item.id, item));

  // Merge incoming, keeping newer
  incoming.forEach(item => {
    const existingItem = map.get(item.id);
    if (
      !existingItem ||
      (item.timestamp || 0) > (existingItem.timestamp || 0)
    ) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}

/**
 * Performance timer for debugging
 */
export class PerformanceTimer {
  private startTime: number = 0;
  private label: string;

  constructor(label: string) {
    this.label = label;
  }

  start(): void {
    this.startTime = performance.now();
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    if (__DEV__) {
    }
    return duration;
  }

  static measure<T>(label: string, fn: () => T): T {
    const timer = new PerformanceTimer(label);
    timer.start();
    const result = fn();
    timer.end();
    return result;
  }

  static async measureAsync<T>(
    label: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const timer = new PerformanceTimer(label);
    timer.start();
    const result = await fn();
    timer.end();
    return result;
  }
}
