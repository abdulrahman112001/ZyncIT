import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { Platform, NativeModules, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { useAuthStore } from './authStore';
import { COLLECTIONS } from '../constants';
import { NativeCredentialsService } from '../services/nativeCredentials';

const { UserCredentialsModule } = NativeModules;

const DEVICE_ID_KEY = '@ZyncIT:deviceId';

interface Device {
  id: string;
  name: string;
  nickname?: string;
  type: string;
  platform: string;
  model: string;
  userId?: string;
  createdAt?: number;
  lastSeen?: number;
  isOnline?: boolean;
}

interface DeviceState {
  currentDevice: Device | null;
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  registerDevice: () => Promise<void>;
  loadDevices: () => void;
  deleteDevice: (deviceId: string) => Promise<void>;
  updateOnlineStatus: (isOnline: boolean) => Promise<void>;
  startOnlineStatusTracking: () => void;
  cleanup: () => void;
}

// Generate a unique device ID based on hardware
const generateDeviceId = async (): Promise<string> => {
  try {
    // Use device unique ID for consistent identification
    const uniqueId = await DeviceInfo.getUniqueId();
    return `${Platform.OS}_${uniqueId}`;
  } catch (e) {
    console.warn('[DeviceStore] Could not get unique ID, using fallback');
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${Platform.OS}_${timestamp}_${randomPart}`;
  }
};

// Get or create persistent device ID
const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    // FIRST: Try to get from native SharedPreferences (ZyncITPrefs)
    // This is critical for consistency with BackgroundSmsService
    console.log(
      '[DeviceStore] getOrCreateDeviceId - UserCredentialsModule available:',
      !!UserCredentialsModule,
    );
    console.log(
      '[DeviceStore] getOrCreateDeviceId - getDeviceId method available:',
      !!UserCredentialsModule?.getDeviceId,
    );

    if (UserCredentialsModule?.getDeviceId) {
      try {
        const nativeId = await UserCredentialsModule.getDeviceId();
        console.log(
          '[DeviceStore] Native SharedPreferences deviceId:',
          nativeId,
        );
        if (nativeId) {
          console.log(
            '[DeviceStore] Got device ID from native SharedPreferences:',
            nativeId,
          );
          // Sync to AsyncStorage for backup
          await AsyncStorage.setItem(DEVICE_ID_KEY, nativeId);
          return nativeId;
        } else {
          console.log('[DeviceStore] Native deviceId is null/empty');
        }
      } catch (e) {
        console.log('[DeviceStore] Could not get native device ID:', e);
      }
    }

    // Second: Check AsyncStorage for existing ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      console.log(
        '[DeviceStore] Found existing device ID in AsyncStorage:',
        storedId,
      );
      return storedId;
    }

    console.log(
      '[DeviceStore] No existing device ID found, generating new one',
    );

    // Generate new ID and store it
    const newId = await generateDeviceId();
    console.log('[DeviceStore] Generated new device ID:', newId);
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch (e) {
    console.error('[DeviceStore] Error in getOrCreateDeviceId:', e);
    // Fallback if AsyncStorage fails
    const fallbackId = await generateDeviceId();
    console.log('[DeviceStore] Using fallback device ID:', fallbackId);
    return fallbackId;
  }
};

export const useDeviceStore = create<DeviceState>((set, get) => ({
  currentDevice: null,
  devices: [],
  isLoading: false,
  error: null,

  registerDevice: async () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      console.log('[DeviceStore] No user, skipping device registration');
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Get persistent device ID
      const deviceId = await getOrCreateDeviceId();

      // Check if already registered in state
      const { currentDevice } = get();
      if (currentDevice && currentDevice.id === deviceId) {
        console.log(
          '[DeviceStore] Device already registered:',
          currentDevice.id,
        );
        set({ isLoading: false });
        return;
      }

      // Get real device info - with fallbacks to avoid undefined
      const deviceName = (await DeviceInfo.getDeviceName()) || 'Android Device';
      const deviceModel = (await DeviceInfo.getModel()) || 'Unknown';
      const systemName = (await DeviceInfo.getSystemName()) || Platform.OS;

      // Check if device already exists to preserve nickname
      const existingDoc = await firestore()
        .collection(COLLECTIONS.DEVICES)
        .doc(deviceId)
        .get();

      const existingData = existingDoc.data();
      const savedNickname = existingData?.nickname || null;

      // Build device object with no undefined values (Firebase rejects undefined)
      const device: Device = {
        id: deviceId,
        name: deviceName,
        type: 'phone',
        platform: systemName,
        model: deviceModel,
        userId: user.uid,
        lastSeen: Date.now(),
        createdAt: existingData?.createdAt || Date.now(),
        isOnline: true,
      };

      // Only add nickname if it exists (avoid undefined)
      if (savedNickname) {
        device.nickname = savedNickname;
      }

      console.log('[DeviceStore] Registering device with ID:', deviceId);
      console.log('[DeviceStore] Device object:', JSON.stringify(device));

      // Save to Firestore - always use set with merge to avoid not-found errors
      await firestore()
        .collection(COLLECTIONS.DEVICES)
        .doc(deviceId)
        .set(device, { merge: true });

      console.log(
        '[DeviceStore] Device registered:',
        deviceId,
        'nickname:',
        savedNickname,
      );
      set({ currentDevice: device, isLoading: false });

      // Save credentials to native for background Firebase access
      try {
        await NativeCredentialsService.saveCredentials(user.uid, deviceId);
        console.log(
          '[DeviceStore] Native credentials saved for background operation',
        );
      } catch (credError) {
        console.warn(
          '[DeviceStore] Failed to save native credentials:',
          credError,
        );
      }
    } catch (error: any) {
      console.error('[DeviceStore] Error registering device:', error);

      // Fallback: create a local device only
      const { user: currentUser } = useAuthStore.getState();
      const fallbackDevice: Device = {
        id: `android_${Date.now()}`,
        name: 'Android Device',
        type: 'phone',
        platform: Platform.OS,
        model: 'Unknown',
        userId: currentUser?.uid,
      };

      set({
        currentDevice: fallbackDevice,
        isLoading: false,
        error: error.message,
      });
    }
  },

  loadDevices: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ isLoading: true });

    firestore()
      .collection(COLLECTIONS.DEVICES)
      .where('userId', '==', user.uid)
      .get()
      .then(snapshot => {
        const devices: Device[] = [];
        snapshot.forEach(doc => {
          devices.push({ id: doc.id, ...doc.data() } as Device);
        });
        set({ devices, isLoading: false });
      })
      .catch(error => {
        set({ error: error.message, isLoading: false });
      });
  },

  // حذف جهاز وجميع إشعاراته
  deleteDevice: async (deviceId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ isLoading: true });

    try {
      // حذف جميع الإشعارات الخاصة بالجهاز
      const notificationsRef = firestore()
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .collection(COLLECTIONS.DEVICES)
        .doc(deviceId)
        .collection(COLLECTIONS.NOTIFICATIONS);

      const notificationsSnapshot = await notificationsRef.get();
      const batch = firestore().batch();

      notificationsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // حذف الجهاز من مجموعة devices الرئيسية
      const devicesQuery = await firestore()
        .collection(COLLECTIONS.DEVICES)
        .where('id', '==', deviceId)
        .where('userId', '==', user.uid)
        .get();

      devicesQuery.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      // تحديث القائمة محلياً
      set(state => ({
        devices: state.devices.filter(d => d.id !== deviceId),
        isLoading: false,
      }));

      console.log('✅ Device deleted:', deviceId);
    } catch (error: any) {
      console.error('❌ Error deleting device:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  cleanup: () => {
    set({ currentDevice: null, devices: [], error: null });
  },

  updateOnlineStatus: async (isOnline: boolean) => {
    const { currentDevice } = get();
    if (!currentDevice) return;

    try {
      // Use set with merge to avoid not-found errors
      await firestore()
        .collection(COLLECTIONS.DEVICES)
        .doc(currentDevice.id)
        .set(
          {
            isOnline,
            lastSeen: Date.now(),
          },
          { merge: true },
        );

      set({
        currentDevice: { ...currentDevice, isOnline, lastSeen: Date.now() },
      });

      console.log(`[DeviceStore] Online status updated: ${isOnline}`);
    } catch (error) {
      console.error('[DeviceStore] Failed to update online status:', error);
    }
  },

  startOnlineStatusTracking: () => {
    const { updateOnlineStatus } = get();

    // Set online when app becomes active
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        updateOnlineStatus(true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        updateOnlineStatus(false);
      }
    };

    AppState.addEventListener('change', handleAppStateChange);

    // Set online immediately
    updateOnlineStatus(true);
  },
}));
