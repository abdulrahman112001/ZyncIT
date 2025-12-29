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
      console.log('[NativeCredentials] Not Android, skipping');
      return false;
    }

    if (!UserCredentialsModule) {
      console.warn('[NativeCredentials] UserCredentialsModule not available');
      return false;
    }

    try {
      await UserCredentialsModule.saveCredentials(userId, deviceId);
      console.log('[NativeCredentials] Credentials saved:', {
        userId,
        deviceId,
      });
      return true;
    } catch (error) {
      console.error('[NativeCredentials] Error saving credentials:', error);
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
      console.warn('[NativeCredentials] UserCredentialsModule not available');
      return false;
    }

    try {
      await UserCredentialsModule.clearCredentials();
      console.log('[NativeCredentials] Credentials cleared');
      return true;
    } catch (error) {
      console.error('[NativeCredentials] Error clearing credentials:', error);
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
      console.error('[NativeCredentials] Error checking login status:', error);
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
};

export default NativeCredentialsService;
