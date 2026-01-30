/**
 * NetworkContext
 * Network connectivity monitoring context
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import NetInfo, {
  NetInfoState,
  NetInfoSubscription,
} from '@react-native-community/netinfo';

// Types
export type ConnectionType =
  | 'wifi'
  | 'cellular'
  | 'ethernet'
  | 'bluetooth'
  | 'unknown'
  | 'none';
export type ConnectionQuality =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'unknown';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: ConnectionType;
  connectionQuality: ConnectionQuality;
  details: NetInfoState | null;
  isInitialized: boolean;
}

export interface NetworkContextValue extends NetworkState {
  refresh: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
}

// Default state
const defaultState: NetworkState = {
  isConnected: true,
  isInternetReachable: null,
  connectionType: 'unknown',
  connectionQuality: 'unknown',
  details: null,
  isInitialized: false,
};

// Create context
const NetworkContext = createContext<NetworkContextValue | undefined>(
  undefined,
);

// Provider Props
interface NetworkProviderProps {
  children: ReactNode;
  /** Show offline banner automatically */
  showOfflineBanner?: boolean;
}

/**
 * Determine connection quality based on connection details
 */
const getConnectionQuality = (state: NetInfoState): ConnectionQuality => {
  if (!state.isConnected) return 'poor';

  if (state.type === 'wifi') {
    // WiFi is generally good
    return 'excellent';
  }

  if (state.type === 'cellular') {
    const cellularGeneration = (state.details as any)?.cellularGeneration;

    switch (cellularGeneration) {
      case '5g':
        return 'excellent';
      case '4g':
        return 'good';
      case '3g':
        return 'fair';
      case '2g':
        return 'poor';
      default:
        return 'unknown';
    }
  }

  return 'unknown';
};

/**
 * Map NetInfo type to our ConnectionType
 */
const mapConnectionType = (type: string): ConnectionType => {
  switch (type) {
    case 'wifi':
      return 'wifi';
    case 'cellular':
      return 'cellular';
    case 'ethernet':
      return 'ethernet';
    case 'bluetooth':
      return 'bluetooth';
    case 'none':
      return 'none';
    default:
      return 'unknown';
  }
};

/**
 * NetworkProvider Component
 */
export const NetworkProvider: React.FC<NetworkProviderProps> = ({
  children,
  showOfflineBanner = true,
}) => {
  const [state, setState] = useState<NetworkState>(defaultState);

  // Handle network state change
  const handleNetworkChange = useCallback((netInfoState: NetInfoState) => {
    setState({
      isConnected: netInfoState.isConnected ?? false,
      isInternetReachable: netInfoState.isInternetReachable,
      connectionType: mapConnectionType(netInfoState.type),
      connectionQuality: getConnectionQuality(netInfoState),
      details: netInfoState,
      isInitialized: true,
    });
  }, []);

  // Subscribe to network changes
  useEffect(() => {
    let unsubscribe: NetInfoSubscription;

    // Get initial state
    NetInfo.fetch().then(handleNetworkChange);

    // Subscribe to changes
    unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleNetworkChange]);

  // Refresh network state
  const refresh = useCallback(async () => {
    const netInfoState = await NetInfo.fetch();
    handleNetworkChange(netInfoState);
  }, [handleNetworkChange]);

  // Check connection
  const checkConnection = useCallback(async (): Promise<boolean> => {
    const netInfoState = await NetInfo.fetch();
    return netInfoState.isConnected ?? false;
  }, []);

  // Memoized context value
  const value = useMemo<NetworkContextValue>(
    () => ({
      ...state,
      refresh,
      checkConnection,
    }),
    [state, refresh, checkConnection],
  );

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
};

/**
 * useNetwork Hook
 */
export const useNetwork = (): NetworkContextValue => {
  const context = useContext(NetworkContext);

  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }

  return context;
};

/**
 * useIsOnline Hook - Simple hook to check online status
 */
export const useIsOnline = (): boolean => {
  const { isConnected, isInternetReachable } = useNetwork();
  return isConnected && isInternetReachable !== false;
};

/**
 * useConnectionType Hook
 */
export const useConnectionType = (): ConnectionType => {
  const { connectionType } = useNetwork();
  return connectionType;
};

export default NetworkContext;
