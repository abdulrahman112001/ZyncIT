/**
 * useAppState Hook
 * Monitor app foreground/background state
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export type AppStateType = 'active' | 'background' | 'inactive' | 'unknown';

export interface UseAppStateOptions {
  /** Callback when app comes to foreground */
  onForeground?: () => void;
  /** Callback when app goes to background */
  onBackground?: () => void;
  /** Callback on any state change */
  onChange?: (state: AppStateType) => void;
}

export interface AppStateResult {
  /** Current app state */
  appState: AppStateType;
  /** Previous app state */
  previousState: AppStateType;
  /** Is app in foreground (active) */
  isForeground: boolean;
  /** Is app in background */
  isBackground: boolean;
  /** Time since last state change (ms) */
  timeSinceLastChange: number;
}

/**
 * Hook to monitor app state changes
 */
export const useAppState = (
  options: UseAppStateOptions = {},
): AppStateResult => {
  const { onForeground, onBackground, onChange } = options;

  const [appState, setAppState] = useState<AppStateType>(
    mapAppState(AppState.currentState),
  );
  const [previousState, setPreviousState] = useState<AppStateType>('unknown');
  const lastChangeTime = useRef<number>(Date.now());
  const [timeSinceLastChange, setTimeSinceLastChange] = useState(0);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const newState = mapAppState(nextAppState);
        const oldState = appState;

        setPreviousState(oldState);
        setAppState(newState);
        lastChangeTime.current = Date.now();
        setTimeSinceLastChange(0);

        // Call callbacks
        onChange?.(newState);

        if (oldState !== 'active' && newState === 'active') {
          onForeground?.();
        }

        if (oldState === 'active' && newState !== 'active') {
          onBackground?.();
        }
      },
    );

    return () => subscription.remove();
  }, [appState, onForeground, onBackground, onChange]);

  // Update time since last change
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSinceLastChange(Date.now() - lastChangeTime.current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    appState,
    previousState,
    isForeground: appState === 'active',
    isBackground: appState === 'background',
    timeSinceLastChange,
  };
};

/**
 * Map React Native AppState to our type
 */
const mapAppState = (state: AppStateStatus): AppStateType => {
  switch (state) {
    case 'active':
      return 'active';
    case 'background':
      return 'background';
    case 'inactive':
      return 'inactive';
    default:
      return 'unknown';
  }
};

/**
 * Hook that returns true only when app is in foreground
 */
export const useIsForeground = (): boolean => {
  const { isForeground } = useAppState();
  return isForeground;
};

/**
 * Hook that calls a function when app comes to foreground
 */
export const useOnForeground = (callback: () => void) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useAppState({
    onForeground: () => callbackRef.current(),
  });
};

/**
 * Hook that calls a function when app goes to background
 */
export const useOnBackground = (callback: () => void) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useAppState({
    onBackground: () => callbackRef.current(),
  });
};

export default useAppState;
