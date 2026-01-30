/**
 * React Performance Utilities
 * React-specific optimizations for components and hooks
 */

import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  ComponentType,
} from 'react';
import { FlatListProps, ViewStyle } from 'react-native';

// ============================================
// Memoization Utilities
// ============================================

/**
 * Deep equality comparison
 */
const isEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== 'object' || obj1 === null || obj2 === null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !isEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
};

/**
 * Create a memoized component with deep comparison
 */
export function memoWithDeepCompare<T extends ComponentType<any>>(
  Component: T,
  displayName?: string,
): T {
  const MemoizedComponent = memo(Component, isEqual);

  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }

  return MemoizedComponent as T;
}

/**
 * Create a memoized component with custom comparison
 */
export function memoWithCompare<P extends object>(
  Component: ComponentType<P>,
  compare: (prevProps: P, nextProps: P) => boolean,
  displayName?: string,
): React.MemoExoticComponent<ComponentType<P>> {
  const MemoizedComponent = memo(Component, compare);

  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }

  return MemoizedComponent;
}

/**
 * Compare specific props only
 */
export function createPropComparator<P extends object>(
  keysToCompare: (keyof P)[],
): (prevProps: P, nextProps: P) => boolean {
  return (prevProps: P, nextProps: P) => {
    for (const key of keysToCompare) {
      if (!isEqual(prevProps[key], nextProps[key])) {
        return false;
      }
    }
    return true;
  };
}

// ============================================
// List Optimization Utilities
// ============================================

export interface OptimizedListConfig {
  /** Number of items to render per batch */
  maxToRenderPerBatch?: number;
  /** Number of items to render initially */
  initialNumToRender?: number;
  /** Window size multiplier */
  windowSize?: number;
  /** Update cells batch interval */
  updateCellsBatchingPeriod?: number;
  /** Remove clipped subviews */
  removeClippedSubviews?: boolean;
}

const DEFAULT_LIST_CONFIG: Required<OptimizedListConfig> = {
  maxToRenderPerBatch: 10,
  initialNumToRender: 10,
  windowSize: 5,
  updateCellsBatchingPeriod: 50,
  removeClippedSubviews: true,
};

/**
 * Get optimized FlatList props
 */
export function getOptimizedListProps(
  config?: OptimizedListConfig,
): Partial<FlatListProps<any>> {
  const mergedConfig = { ...DEFAULT_LIST_CONFIG, ...config };

  return {
    maxToRenderPerBatch: mergedConfig.maxToRenderPerBatch,
    initialNumToRender: mergedConfig.initialNumToRender,
    windowSize: mergedConfig.windowSize,
    updateCellsBatchingPeriod: mergedConfig.updateCellsBatchingPeriod,
    removeClippedSubviews: mergedConfig.removeClippedSubviews,
  };
}

/**
 * Hook to create optimized key extractor
 */
export function useKeyExtractor<T>(
  getKey: (item: T) => string | number,
): (item: T, index: number) => string {
  return useCallback(
    (item: T, index: number) => {
      const key = getKey(item);
      return key?.toString() ?? index.toString();
    },
    [getKey],
  );
}

/**
 * Hook to create stable item layout calculator
 */
export function useGetItemLayout<T>(
  itemHeight: number,
  separatorHeight: number = 0,
): (
  data: ArrayLike<T> | null | undefined,
  index: number,
) => { length: number; offset: number; index: number } {
  return useCallback(
    (_data: ArrayLike<T> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: (itemHeight + separatorHeight) * index,
      index,
    }),
    [itemHeight, separatorHeight],
  );
}

// ============================================
// Callback Optimization
// ============================================

/**
 * Hook to create a stable callback that always calls the latest function
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
}

/**
 * Hook to batch multiple callbacks into one
 */
export function useBatchedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number = 100,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingArgsRef = useRef<Parameters<T>[]>([]);

  return useCallback(
    ((...args) => {
      pendingArgsRef.current.push(args);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const allArgs = pendingArgsRef.current;
        pendingArgsRef.current = [];

        // Execute with the last args
        if (allArgs.length > 0) {
          callback(...allArgs[allArgs.length - 1]);
        }
      }, delay);
    }) as T,
    [callback, delay],
  );
}

// ============================================
// Style Optimization
// ============================================

/**
 * Hook to create memoized styles
 */
export function useMemoizedStyles<T extends Record<string, ViewStyle>>(
  styleFactory: () => T,
  deps: React.DependencyList,
): T {
  return useMemo(styleFactory, deps);
}

/**
 * Create a cached style sheet
 */
const styleCache = new Map<string, any>();

export function getCachedStyle<T>(key: string, styleFactory: () => T): T {
  if (!styleCache.has(key)) {
    styleCache.set(key, styleFactory());
  }
  return styleCache.get(key);
}

/**
 * Clear style cache
 */
export function clearStyleCache(): void {
  styleCache.clear();
}

// ============================================
// Component Optimization
// ============================================

/**
 * Higher-order component to add performance optimization
 */
export function withPerformanceOptimization<P extends object>(
  WrappedComponent: ComponentType<P>,
  options?: {
    displayName?: string;
    deepCompare?: boolean;
    compareKeys?: (keyof P)[];
  },
): React.MemoExoticComponent<ComponentType<P>> {
  const { displayName, deepCompare = false, compareKeys } = options || {};

  let MemoizedComponent: React.MemoExoticComponent<ComponentType<P>>;

  if (compareKeys) {
    MemoizedComponent = memoWithCompare(
      WrappedComponent,
      createPropComparator(compareKeys),
      displayName,
    );
  } else if (deepCompare) {
    MemoizedComponent = memo(WrappedComponent, isEqual);
  } else {
    MemoizedComponent = memo(WrappedComponent);
  }

  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }

  return MemoizedComponent;
}

// ============================================
// Render Optimization (Debug Only)
// ============================================

/**
 * Hook to track renders (for debugging)
 */
export function useRenderCount(componentName?: string): number {
  const renderCount = useRef(0);
  renderCount.current += 1;

  if (__DEV__ && componentName) {
    console.log(`[Render] ${componentName}: ${renderCount.current}`);
  }

  return renderCount.current;
}

/**
 * Hook to detect unnecessary re-renders
 */
export function useWhyDidYouUpdate<T extends object>(
  name: string,
  props: T,
): void {
  const previousProps = useRef<T>();

  if (__DEV__) {
    if (previousProps.current) {
      const allKeys = Object.keys({
        ...previousProps.current,
        ...props,
      }) as (keyof T)[];
      const changedProps: Partial<Record<keyof T, { from: any; to: any }>> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log(`[WhyDidYouUpdate] ${name}`, changedProps);
      }
    }

    previousProps.current = props;
  }
}

export default {
  memoWithDeepCompare,
  memoWithCompare,
  createPropComparator,
  getOptimizedListProps,
  useKeyExtractor,
  useGetItemLayout,
  useStableCallback,
  useBatchedCallback,
  useMemoizedStyles,
  getCachedStyle,
  clearStyleCache,
  withPerformanceOptimization,
  useRenderCount,
  useWhyDidYouUpdate,
};
