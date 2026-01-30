/**
 * useNetworkStatus Hook
 * Monitor network connectivity status
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  isWifi: boolean;
  isCellular: boolean;
  details: NetInfoState | null;
}

/**
 * Hook to monitor network connectivity
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: 'unknown',
    isWifi: false,
    isCellular: false,
    details: null,
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(state => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        details: state,
      });
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        details: state,
      });
    });

    return unsubscribe;
  }, []);

  return status;
};

export default useNetworkStatus;
