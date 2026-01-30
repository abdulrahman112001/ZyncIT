/**
 * ZyncIT Contexts - Main Export
 */

// Theme Context
export { ThemeProvider, useTheme } from './ThemeContext';

// Auth Context
export { AuthProvider, useAuth } from './AuthContext';
export type { User, AuthState, AuthContextValue } from './AuthContext';

// Network Context
export {
  NetworkProvider,
  useNetwork,
  useIsOnline,
  useConnectionType,
} from './NetworkContext';
export type {
  NetworkState,
  ConnectionQuality,
  ConnectionType,
  NetworkContextValue,
} from './NetworkContext';

// Notification Context
export { NotificationProvider, useNotifications } from './NotificationContext';
export type {
  NotificationState,
  NotificationContextValue,
  NotificationType,
  NotificationPayload,
  NotificationPriority,
} from './NotificationContext';
