import { useEffect, useCallback } from 'react';
import {
  NativeModules,
  Platform,
  PermissionsAndroid,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import { useSMSStore } from '../store/smsStore';
import { useCallStore } from '../store/callStore';
import { useAuthStore } from '../store/authStore';
import { useDeviceStore } from '../store/deviceStore';

const { ZyncITModule, CallLogModule, SmsModule } = NativeModules;

/**
 * Hook للاستماع للأحداث من Native Module
 * يربط بين الـ Native Android Code و React Native
 */
export const useNativeEvents = () => {
  const {
    addMessage,
    addMessageAndSync,
    syncMessagesToFirebase,
    listenForSMSRequests,
  } = useSMSStore();
  const { addCall, addCallAndSync, syncCallsToFirebase } = useCallStore();
  const { user } = useAuthStore();
  const { currentDevice, registerDevice } = useDeviceStore();

  // تسجيل الجهاز عند تحميل المستخدم
  useEffect(() => {
    if (user && !currentDevice) {
      console.log('📱 Registering device...');
      registerDevice();
    }
  }, [user, currentDevice, registerDevice]);

  // الاستماع لطلبات إرسال SMS من Chrome Extension + بدء Foreground Service
  useEffect(() => {
    if (user && currentDevice) {
      console.log('📡 Starting SMS requests listener...');
      listenForSMSRequests();

      // Start foreground service for background SMS listening
      if (Platform.OS === 'android' && SmsModule?.startSmsRequestService) {
        SmsModule.startSmsRequestService()
          .then(() => console.log('✅ SmsRequestService started'))
          .catch((err: any) =>
            console.log('⚠️ SmsRequestService failed:', err),
          );
      }
    }
  }, [user, currentDevice, listenForSMSRequests]);

  // طلب الأذونات المطلوبة
  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return false;

    try {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!allGranted) {
        Alert.alert(
          'Permissions Required',
          'ZyncIT needs SMS and Call permissions to sync your messages and calls.',
          [{ text: 'OK' }],
        );
      }

      return allGranted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  // بدء خدمة المزامنة
  const startSyncService = useCallback(async () => {
    if (Platform.OS !== 'android' || !ZyncITModule) return;

    try {
      const hasPermissions = await requestPermissions();
      if (hasPermissions) {
        await ZyncITModule.startSyncService();
        console.log('Sync service started');
      }
    } catch (error) {
      console.error('Error starting sync service:', error);
    }
  }, [requestPermissions]);

  // إيقاف خدمة المزامنة
  const stopSyncService = useCallback(async () => {
    if (Platform.OS !== 'android' || !ZyncITModule) return;

    try {
      await ZyncITModule.stopSyncService();
      console.log('Sync service stopped');
    } catch (error) {
      console.error('Error stopping sync service:', error);
    }
  }, []);

  // تحميل كل الرسائل من الجهاز
  const loadAllSMS = useCallback(async () => {
    if (Platform.OS !== 'android') return [];

    try {
      if (SmsModule) {
        console.log('[loadAllSMS] Using SmsModule');
        const messages = await SmsModule.getAllSms(100);
        return messages || [];
      } else if (ZyncITModule?.getAllSms) {
        console.log('[loadAllSMS] Using ZyncITModule');
        const messages = await ZyncITModule.getAllSms(100);
        return messages || [];
      }
      console.warn('[loadAllSMS] No native module available');
      return [];
    } catch (error) {
      console.error('Error loading SMS:', error);
      return [];
    }
  }, []);

  // تحميل سجل المكالمات من الجهاز
  const loadCallLog = useCallback(async () => {
    if (Platform.OS !== 'android') return [];

    try {
      // Use CallLogModule first, fallback to ZyncITModule
      if (CallLogModule) {
        console.log('[loadCallLog] Using CallLogModule');
        const calls = await CallLogModule.getCallLog(100);
        console.log('[loadCallLog] Got calls:', calls?.length || 0);
        return calls || [];
      } else if (ZyncITModule?.getCallLog) {
        console.log('[loadCallLog] Using ZyncITModule');
        const calls = await ZyncITModule.getCallLog(100);
        return calls || [];
      }
      console.warn('[loadCallLog] No native module available');
      return [];
    } catch (error) {
      console.error('Error loading call log:', error);
      return [];
    }
  }, []);

  // إرسال رسالة SMS
  const sendSMS = useCallback(async (phoneNumber: string, message: string) => {
    if (Platform.OS !== 'android' || !ZyncITModule) {
      throw new Error('SMS sending is only available on Android');
    }

    try {
      const result = await ZyncITModule.sendSMS(phoneNumber, message);
      return result;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }, []);

  // الاستماع للأحداث من Native Module
  useEffect(() => {
    if (Platform.OS !== 'android' || !user) return;

    console.log('📱 Setting up native event listeners...');

    // الاستماع لرسائل SMS الجديدة - نستخدم DeviceEventEmitter مباشرة
    const smsSubscription = DeviceEventEmitter.addListener(
      'onSmsReceived',
      async data => {
        console.log('📱 SMS received:', data);

        // استخدام timestamp + sender كمفتاح فريد لتجنب التكرار
        const sender = data.sender || data.address || 'Unknown';
        const contactName = data.contactName || '';
        const uniqueId = `sms_${data.timestamp}_${sender}`;

        const newMessage = {
          id: uniqueId,
          sender: sender,
          phoneNumber: sender,
          contactName: contactName,
          receiver: 'me',
          body: data.body || data.message,
          timestamp: data.timestamp || Date.now(),
          read: false,
          type: 'inbox' as const,
          deviceId: 'android',
          threadId: '',
          userId: user.uid,
          syncedAt: Date.now(),
        };

        // حفظ في Firebase مباشرة
        await addMessageAndSync(newMessage, user.uid);
        console.log('✅ SMS synced to Firebase:', sender, contactName);
      },
    );

    // الاستماع للمكالمات الجديدة - نستخدم DeviceEventEmitter مباشرة
    const callSubscription = DeviceEventEmitter.addListener(
      'onCallReceived',
      async data => {
        console.log('📞 Call received:', data);

        // CallReceiver يرسل phoneNumber و contactName
        const phoneNumber = data.phoneNumber || data.number || 'Unknown';
        const contactName = data.contactName || data.name || '';

        const newCall = {
          id: `call_${Date.now()}`,
          userId: user.uid,
          phoneNumber: phoneNumber,
          contactName: contactName,
          type: data.type as 'incoming' | 'outgoing' | 'missed',
          duration: data.duration || 0,
          timestamp: data.timestamp || Date.now(),
          deviceId: 'android',
          syncedAt: Date.now(),
        };

        // حفظ في Firebase مباشرة
        await addCallAndSync(newCall, user.uid);
        console.log('✅ Call synced to Firebase:', phoneNumber, contactName);
      },
    );

    return () => {
      smsSubscription?.remove();
      callSubscription?.remove();
    };
  }, [user, addMessageAndSync, addCallAndSync]); // Start call listener for real-time call events
  const startCallListener = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    try {
      const hasPermissions = await requestPermissions();
      if (hasPermissions && ZyncITModule?.startCallListener) {
        await ZyncITModule.startCallListener();
        console.log('[startCallListener] Call listener started');
      } else {
        // Even without native module, the event listeners are already set up
        console.log('[startCallListener] Using event emitter for calls');
      }
    } catch (error) {
      console.error('Error starting call listener:', error);
    }
  }, [requestPermissions]);

  return {
    requestPermissions,
    startSyncService,
    stopSyncService,
    loadAllSMS,
    loadCallLog,
    sendSMS,
    startCallListener,
  };
};

export default useNativeEvents;
