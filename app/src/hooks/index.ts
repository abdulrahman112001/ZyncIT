export { useNativeEvents, default } from './useNativeEvents';

// Generic Hooks - from organized modules
export {
  useAsync,
  useLoading,
  usePagination,
  useDebounce,
  useDebouncedCallback,
  useThrottle,
  usePrevious,
  useToggle,
  useArray,
  useMap,
  useMemoCompare,
} from './generic';

export type {
  UseAsyncOptions,
  UsePaginationOptions,
  UseArrayReturn,
  UseMapReturn,
} from './generic';

// Network Hooks
export { useNetworkStatus } from './useNetworkStatus';
export type { NetworkStatus } from './useNetworkStatus';

// Keyboard Hooks
export {
  useKeyboard,
  useDismissKeyboard,
  useIsKeyboardVisible,
} from './useKeyboard';
export type { KeyboardState } from './useKeyboard';

// Permission Hooks
export {
  usePermission,
  useRequestPermission,
  usePermissionWithAlert,
  useMultiplePermissions,
} from './usePermissions';
export type { PermissionType, PermissionStatus } from './usePermissions';

// App State Hooks
export {
  useAppState,
  useIsForeground,
  useOnForeground,
  useOnBackground,
} from './useAppState';
export type { AppStateType } from './useAppState';

// Clipboard Hooks
export { useClipboard, useCopyToClipboard } from './useClipboard';
export type { ClipboardState } from './useClipboard';
