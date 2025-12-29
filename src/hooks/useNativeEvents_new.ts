import { useEffect, useCallback } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useSMSStore } from '../store/smsStore';
import { useCallStore } from '../store/callStore';
import { useAuthStore } from '../store/authStore';
import { useDeviceStore } from '../store/deviceStore';
import { useNotificationStore } from '../store/notificationStore';
import { COLLECTIONS } from '../constants';

const { ZyncITModule, CallLogModule, SmsModule } = NativeModules;

const zyncEmitter =
  Platform.OS === 'android' && ZyncITModule
    ? new NativeEventEmitter(ZyncITModule)
    : null;

const callEmitter =
  Platform.OS === 'android' && CallLogModule
    ? new NativeEventEmitter(CallLogModule)
    : null;

const smsEmitter =
  Platform.OS === 'android' && SmsModule
    ? new NativeEventEmitter(SmsModule)
    : null;

const getContactName = async (phoneNumber: string): Promise<string | null> => {
  if (Platform.OS !== 'android' || !SmsModule) return null;
  try {
    const name = await SmsModule.getContactName(phoneNumber);
    return name;
  } catch (error) {
    console.log('[getContactName] Error:', error);
    return null;
  }
};

let permissionsGranted: boolean | null = null;
let alertShown = false;

export const useNativeEvents = () => {
  const { addMessage, syncMessagesToFirebase } = useSMSStore();
  const { addNotification } = useNotificationStore();
  const { addCall } = useCallStore();
  const { user } = useAuthStore();
  const { currentDevice, registerDevice } = useDeviceStore();

  const checkPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const phoneStatePermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      );
      const callLogPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      );
      return phoneStatePermission && callLogPermission;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return false;
    if (permissionsGranted === true) return true;
    try {
      const alreadyGranted = await checkPermissions();
      if (alreadyGranted) {
        permissionsGranted = true;
        return true;
      }
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      ];
      const results = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED,
      );
      permissionsGranted = allGranted;
      if (!allGranted && !alertShown) {
        alertShown = true;
        Alert.alert(
          'Permissions Required',
          'ZyncIT needs SMS, Phone and Call Log permissions to sync your messages and calls. Please grant permissions in Settings.',
          [{ text: 'OK' }],
        );
      }
      return allGranted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, [checkPermissions]);

  const startCallListener = useCallback(async () => {
    if (Platform.OS !== 'android' || !CallLogModule) return false;
    try {
      const hasPermissions = await requestPermissions();
      if (hasPermissions) {
        await CallLogModule.startListening();
        console.log('[CallLogModule] Started listening for calls');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error starting call listener:', error);
      return false;
    }
  }, [requestPermissions]);

  const stopCallListener = useCallback(async () => {
    if (Platform.OS !== 'android' || !CallLogModule) return;
    try {
      await CallLogModule.stopListening();
      console.log('[CallLogModule] Stopped listening for calls');
    } catch (error) {
      console.error('Error stopping call listener:', error);
    }
  }, []);

  const startSyncService = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      const hasPermissions = await requestPermissions();
      if (hasPermissions) {
        await registerDevice();
        await startCallListener();
        if (ZyncITModule) {
          await ZyncITModule.startSyncService();
        }
        console.log('Sync service started');
      }
    } catch (error) {
      console.error('Error starting sync service:', error);
    }
  }, [requestPermissions, startCallListener, registerDevice]);

  const stopSyncService = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    try {
      await stopCallListener();
      if (ZyncITModule) {
        await ZyncITModule.stopSyncService();
      }
      console.log('Sync service stopped');
    } catch (error) {
      console.error('Error stopping sync service:', error);
    }
  }, [stopCallListener]);

  const loadAllSMS = useCallback(async () => {
    if (Platform.OS !== 'android') return [];
    try {
      if (SmsModule) {
        console.log('[loadAllSMS] Using SmsModule');
        const messages = await SmsModule.getAllSms(100);
        return messages || [];
      } else if (ZyncITModule?.getAllSMS) {
        console.log('[loadAllSMS] Using ZyncITModule');
        const messages = await ZyncITModule.getAllSMS(100);
        return messages || [];
      }
      console.warn('[loadAllSMS] No native module available');
      return [];
    } catch (error) {
      console.error('Error loading SMS:', error);
      return [];
    }
  }, []);

  const sendSMS = useCallback(async (phoneNumber: string, message: string) => {
    if (Platform.OS !== 'android') {
      throw new Error('SMS sending is only available on Android');
    }
    try {
      if (SmsModule) {
        const result = await SmsModule.sendSms(phoneNumber, message);
        return result;
      } else if (ZyncITModule?.sendSMS) {
        const result = await ZyncITModule.sendSMS(phoneNumber, message);
        return result;
      }
      throw new Error('No native SMS module available');
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }, []);

  const saveSmsToFirebase = useCallback(
    async (smsData: any) => {
      if (!user) {
        console.log('[saveSmsToFirebase] No user, skipping');
        return;
      }
      try {
        let deviceId = currentDevice?.id;
        if (!deviceId) {
          await registerDevice();
          deviceId = useDeviceStore.getState().currentDevice?.id || `android_${Date.now()};
        }
        const phoneNumber = smsData.phoneNumber || smsData.sender || 'Unknown';
        const smsDoc = {
          userId: user.uid,
          deviceId: deviceId,
          phoneNumber: phoneNumber,
          body: smsData.body || smsData.message || '',
          timestamp: smsData.timestamp || Date.now(),
          syncedAt: Date.now(),
          type: 'received',
          read: false,
        };
        const docId = `_${smsDoc.timestamp}_${phoneNumber};
        await firestore()
          .collection(COLLECTIONS.SMS)
          .doc(docId)
          .set(smsDoc, { merge: true });
        console.log('[saveSmsToFirebase] SMS saved:', docId);
      } catch (error) {
        console.error('[saveSmsToFirebase] Error:', error);
      }
    },
    [user, currentDevice, registerDevice],
  );
