/**
 * usePermissions Hook
 * Request and manage app permissions
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Linking, Alert } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
  PermissionStatus,
  openSettings,
} from 'react-native-permissions';

// Permission types
export type PermissionType =
  | 'camera'
  | 'microphone'
  | 'photoLibrary'
  | 'contacts'
  | 'location'
  | 'locationAlways'
  | 'notifications'
  | 'sms'
  | 'phone'
  | 'storage';

export type PermissionState =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable'
  | 'limited'
  | 'unknown';

export interface PermissionResult {
  status: PermissionState;
  canAskAgain: boolean;
}

// Map our permission types to react-native-permissions
const getPermission = (type: PermissionType): Permission | null => {
  if (Platform.OS === 'ios') {
    switch (type) {
      case 'camera':
        return PERMISSIONS.IOS.CAMERA;
      case 'microphone':
        return PERMISSIONS.IOS.MICROPHONE;
      case 'photoLibrary':
        return PERMISSIONS.IOS.PHOTO_LIBRARY;
      case 'contacts':
        return PERMISSIONS.IOS.CONTACTS;
      case 'location':
        return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
      case 'locationAlways':
        return PERMISSIONS.IOS.LOCATION_ALWAYS;
      default:
        return null;
    }
  } else {
    switch (type) {
      case 'camera':
        return PERMISSIONS.ANDROID.CAMERA;
      case 'microphone':
        return PERMISSIONS.ANDROID.RECORD_AUDIO;
      case 'photoLibrary':
        return PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
      case 'contacts':
        return PERMISSIONS.ANDROID.READ_CONTACTS;
      case 'location':
        return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      case 'locationAlways':
        return PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;
      case 'sms':
        return PERMISSIONS.ANDROID.READ_SMS;
      case 'phone':
        return PERMISSIONS.ANDROID.READ_CALL_LOG;
      case 'storage':
        return PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
      default:
        return null;
    }
  }
};

// Map result to our state
const mapResult = (result: PermissionStatus): PermissionState => {
  switch (result) {
    case RESULTS.GRANTED:
      return 'granted';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    case RESULTS.LIMITED:
      return 'limited';
    default:
      return 'unknown';
  }
};

/**
 * Hook to check permission status
 */
export const usePermission = (type: PermissionType): PermissionResult => {
  const [result, setResult] = useState<PermissionResult>({
    status: 'unknown',
    canAskAgain: true,
  });

  useEffect(() => {
    const checkPermission = async () => {
      const permission = getPermission(type);
      if (!permission) {
        setResult({ status: 'unavailable', canAskAgain: false });
        return;
      }

      try {
        const status = await check(permission);
        setResult({
          status: mapResult(status),
          canAskAgain: status !== RESULTS.BLOCKED,
        });
      } catch (error) {
        console.error(`Failed to check ${type} permission:`, error);
        setResult({ status: 'unknown', canAskAgain: true });
      }
    };

    checkPermission();
  }, [type]);

  return result;
};

/**
 * Hook to request permission
 */
export const useRequestPermission = () => {
  const requestPermission = useCallback(
    async (type: PermissionType): Promise<PermissionResult> => {
      const permission = getPermission(type);
      if (!permission) {
        return { status: 'unavailable', canAskAgain: false };
      }

      try {
        const status = await request(permission);
        return {
          status: mapResult(status),
          canAskAgain: status !== RESULTS.BLOCKED,
        };
      } catch (error) {
        console.error(`Failed to request ${type} permission:`, error);
        return { status: 'unknown', canAskAgain: true };
      }
    },
    [],
  );

  return requestPermission;
};

/**
 * Hook to check and request permission with alert
 */
export const usePermissionWithAlert = () => {
  const requestPermission = useRequestPermission();

  const checkAndRequest = useCallback(
    async (
      type: PermissionType,
      options?: {
        title?: string;
        message?: string;
        buttonPositive?: string;
        buttonNegative?: string;
      },
    ): Promise<boolean> => {
      const permission = getPermission(type);
      if (!permission) return false;

      try {
        // First check current status
        const currentStatus = await check(permission);

        if (currentStatus === RESULTS.GRANTED) {
          return true;
        }

        if (currentStatus === RESULTS.BLOCKED) {
          // Show alert to open settings
          Alert.alert(
            options?.title || 'الصلاحية مطلوبة',
            options?.message || 'يرجى تفعيل الصلاحية من الإعدادات',
            [
              { text: options?.buttonNegative || 'إلغاء', style: 'cancel' },
              {
                text: options?.buttonPositive || 'فتح الإعدادات',
                onPress: () => openSettings(),
              },
            ],
          );
          return false;
        }

        // Request permission
        const result = await requestPermission(type);
        return result.status === 'granted';
      } catch (error) {
        console.error(`Failed to check/request ${type} permission:`, error);
        return false;
      }
    },
    [requestPermission],
  );

  return checkAndRequest;
};

/**
 * Hook to check multiple permissions
 */
export const useMultiplePermissions = (types: PermissionType[]) => {
  const [results, setResults] = useState<
    Record<PermissionType, PermissionResult>
  >({} as any);

  useEffect(() => {
    const checkAll = async () => {
      const newResults: Record<PermissionType, PermissionResult> = {} as any;

      for (const type of types) {
        const permission = getPermission(type);
        if (!permission) {
          newResults[type] = { status: 'unavailable', canAskAgain: false };
          continue;
        }

        try {
          const status = await check(permission);
          newResults[type] = {
            status: mapResult(status),
            canAskAgain: status !== RESULTS.BLOCKED,
          };
        } catch {
          newResults[type] = { status: 'unknown', canAskAgain: true };
        }
      }

      setResults(newResults);
    };

    checkAll();
  }, [types.join(',')]);

  return results;
};

/**
 * Open app settings
 */
export const openAppSettings = (): void => {
  openSettings().catch(() => {
    // Fallback to Linking
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  });
};

export default usePermission;
