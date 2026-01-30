import { NativeModules, Platform } from 'react-native';

const { UserCredentialsModule } = NativeModules;

/**
 * Service to save user credentials to native storage
 * This allows the NotificationService to send notifications to Firebase
 * even when the React Native app is closed
 */
export const NativeCredentialsService = {
  /**
   * Save user credentials to native SharedPreferences
   * Call this after successful login and device registration
   */
  saveCredentials: async (
    userId: string,
    deviceId: string,
  ): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!UserCredentialsModule) {
      return false;
    }

    try {
      await UserCredentialsModule.saveCredentials(userId, deviceId);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Clear user credentials from native storage
   * Call this on logout
   */
  clearCredentials: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!UserCredentialsModule) {
      return false;
    }

    try {
      await UserCredentialsModule.clearCredentials();
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Check if user is logged in (from native perspective)
   */
  isLoggedIn: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!UserCredentialsModule) {
      return false;
    }

    try {
      return await UserCredentialsModule.isLoggedIn();
    } catch (error) {
      return false;
    }
  },

  /**
   * Get stored user ID
   */
  getUserId: async (): Promise<string | null> => {
    if (Platform.OS !== 'android' || !UserCredentialsModule) {
      return null;
    }

    try {
      return await UserCredentialsModule.getUserId();
    } catch (error) {
      return null;
    }
  },

  /**
   * Get stored device ID
   */
  getDeviceId: async (): Promise<string | null> => {
    if (Platform.OS !== 'android' || !UserCredentialsModule) {
      return null;
    }

    try {
      return await UserCredentialsModule.getDeviceId();
    } catch (error) {
      return null;
    }
  },

  /**
   * Save device friendly name to native storage
   * This is used when sending notifications to Firebase
   */
  saveDeviceName: async (deviceName: string): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return false;
    }

    if (!UserCredentialsModule) {
      return false;
    }

    try {
      await UserCredentialsModule.saveDeviceName(deviceName);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get stored device friendly name
   */
  getDeviceName: async (): Promise<string | null> => {
    if (Platform.OS !== 'android' || !UserCredentialsModule) {
      return null;
    }

    try {
      return await UserCredentialsModule.getDeviceName();
    } catch (error) {
      return null;
    }
  },
};

export default NativeCredentialsService;
