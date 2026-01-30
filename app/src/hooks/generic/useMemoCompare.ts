/**
 * useMemoCompare Hook
 *
 * Memo with custom comparison function
 */

import { useRef, useEffect } from 'react';

export function useMemoCompare<T>(
  value: T,
  compare: (prev: T | undefined, next: T) => boolean,
): T {
  const previousRef = useRef<T>();

  const isEqual = compare(previousRef.current, value);

  useEffect(() => {
    if (!isEqual) {
      previousRef.current = value;
    }
  });

  return isEqual ? previousRef.current! : value;
}
