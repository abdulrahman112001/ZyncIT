import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './authStore';
import { COLLECTIONS } from '../constants';
import { NativeCredentialsService } from '../services/nativeCredentials';

const DEVICE_ID_KEY = '@ZyncIT:deviceId';

interface Device {
  id: string;
  name: string;
  type: string;
  platform: string;
  model: string;
  userId?: string;
  createdAt?: number;
  lastSeen?: number;
}

interface DeviceState {
  currentDevice: Device | null;
  devices: Device[];
  isLoading: boolean;
  error: string | null;
  registerDevice: () => Promise<void>;
  loadDevices: () => void;
  cleanup: () => void;
}

// Generate a unique device ID
const generateDeviceId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${Platform.OS}_${timestamp}_${randomPart}`;
};

// Get or create persistent device ID
const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    // First check AsyncStorage for existing ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // Try to get from ZyncITModule if available
    if (NativeModules.ZyncITModule?.getDeviceId) {
      try {
        const id = await NativeModules.ZyncITModule.getDeviceId();
        if (id) {
          await AsyncStorage.setItem(DEVICE_ID_KEY, id);
          return id;
        }
      } catch (e) {
        console.log('[DeviceStore] Could not get native device ID');
      }
    }

    // Generate new ID and store it
    const newId = generateDeviceId();
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch (e) {
    // Fallback if AsyncStorage fails
    return generateDeviceId();
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

    // If already registered, skip
    const { currentDevice } = get();
    if (currentDevice) {
      console.log('[DeviceStore] Device already registered:', currentDevice.id);
      return;
    }

    try {
      set({ isLoading: true, error: null });

      // Get persistent device ID
      const deviceId = await getOrCreateDeviceId();

      const device: Device = {
        id: deviceId,
        name: 'Android Device',
        type: 'phone',
        platform: Platform.OS,
        model: 'Unknown',
        userId: user.uid,
        lastSeen: Date.now(),
        createdAt: Date.now(),
      };

      // Save to Firestore - always use set with merge to avoid not-found errors
      await firestore()
        .collection(COLLECTIONS.DEVICES)
        .doc(deviceId)
        .set(device, { merge: true });

      console.log('[DeviceStore] Device registered:', deviceId);
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

  cleanup: () => {
    set({ currentDevice: null, devices: [], error: null });
  },
}));
