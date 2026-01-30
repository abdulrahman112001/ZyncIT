import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { NativeModules } from 'react-native';
import { SMS, SendSMSRequest } from '../types';
import { COLLECTIONS, SMS_PAGE_SIZE } from '../constants';
import { useAuthStore } from './authStore';
import { useDeviceStore } from './deviceStore';
import {
  AppError,
  parseSmsError,
  parseFirestoreError,
  logError,
  ErrorCode,
} from '../utils/errors';
import { smsLogger as logger } from '../utils/logger';
import {
  BatchProcessor,
  deduplicateById,
  mergeByIdKeepNewest,
} from '../utils/performance';

const { SmsModule } = NativeModules;

// Track if SMS requests listener is already active
let smsRequestsUnsubscribe: (() => void) | null = null;

// Normalize phone number for comparison (remove +, spaces, dashes, etc.)
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-digit characters
  let normalized = phone.replace(/\D/g, '');
  // Remove leading zeros
  normalized = normalized.replace(/^0+/, '');
  // Get last 9 digits for comparison (handles country codes)
  if (normalized.length > 9) {
    normalized = normalized.slice(-9);
  }
  return normalized;
};

// Check if two phone numbers match
const phoneNumbersMatch = (phone1: string, phone2: string): boolean => {
  const n1 = normalizePhoneNumber(phone1);
  const n2 = normalizePhoneNumber(phone2);
  if (!n1 || !n2) return false;
  return n1 === n2 || n1.endsWith(n2) || n2.endsWith(n1);
};

interface SMSState {
  messages: SMS[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  // Actions
  loadMessages: () => void;
  loadMessagesForSender: (sender: string) => Promise<SMS[]>;
  setMessages: (messages: SMS[]) => void;
  addMessage: (message: SMS) => void;
  addMessageAndSync: (message: SMS, userId: string) => Promise<void>;
  syncMessages: (localMessages: any[]) => Promise<void>;
  syncMessagesToFirebase: (userId: string) => Promise<void>;
  sendSMS: (phoneNumber: string, message: string) => Promise<void>;
  listenForSMSRequests: () => void;
  stopListeningForSMSRequests: () => void;
  markAsRead: (messageId: string) => Promise<void>;
  markMessagesAsReadBySender: (sender: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteMessagesBySender: (sender: string) => Promise<void>;
  deleteAllMessages: () => Promise<void>;
  cleanup: () => void;
}

export const useSMSStore = create<SMSState>((set, get) => ({
  messages: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  unsubscribe: null,

  setMessages: (messages: SMS[]) => {
    set({ messages });
  },

  addMessage: (message: SMS) => {
    const { messages } = get();
    // تجنب التكرار
    if (!messages.find(m => m.id === message.id)) {
      set({ messages: [message, ...messages] });
    }
  },

  // إضافة رسالة وحفظها في Firebase مباشرة
  addMessageAndSync: async (message: SMS, userId: string) => {
    const { messages } = get();
    let { currentDevice } = useDeviceStore.getState();

    // تجنب التكرار
    if (!messages.find(m => m.id === message.id)) {
      set({ messages: [message, ...messages] });
    } else {
    }

    // If no currentDevice, try to register it first
    if (!currentDevice && userId) {
      try {
        await useDeviceStore.getState().registerDevice();
        currentDevice = useDeviceStore.getState().currentDevice;
      } catch (e) {}
    }

    // حفظ في Firebase كإشعار (في نفس مسار الإشعارات)
    if (userId && currentDevice) {
      try {
        const phoneNumber =
          (message as any).phoneNumber || (message as any).sender || 'unknown';
        const contactName = (message as any).contactName || '';
        const messageText = message.body || message.text || '';

        // استخدام messageHash بنفس طريقة BackgroundSmsService.java لتجنب التكرار
        const messageHash = Math.abs(
          `${phoneNumber}${messageText}`.split('').reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
          }, 0),
        );

        // تحويل SMS إلى صيغة إشعار
        const notificationData = {
          id: message.id,
          key: `sms_${message.id}`,
          packageName: 'com.android.mms',
          title: contactName || phoneNumber,
          text: messageText,
          content: messageText,
          appName: 'SMS',
          type: 'sms',
          smsType: message.type || 'inbox', // حفظ نوع الرسالة: sent أو inbox
          timestamp: message.timestamp,
          receivedAt: message.timestamp,
          read: message.read || false,
          userId,
          deviceId: currentDevice.id,
          deviceName:
            currentDevice.nickname || currentDevice.name || 'Android Device',
          phoneNumber,
          contactName,
          syncedAt: Date.now(),
        };

        // استخدام نفس بنية docId مثل BackgroundSmsService.java: sms_deviceId_timestamp_messageHash
        const docId = `sms_${currentDevice.id}_${message.timestamp}_${messageHash}`;

        // حفظ في مسار الإشعارات: users/{userId}/devices/{deviceId}/notifications
        await firestore()
          .collection(COLLECTIONS.USERS)
          .doc(userId)
          .collection(COLLECTIONS.DEVICES)
          .doc(currentDevice.id)
          .collection(COLLECTIONS.NOTIFICATIONS)
          .doc(docId)
          .set(notificationData, { merge: true });
      } catch (error) {}
    } else {
    }
  },

  syncMessagesToFirebase: async (userId: string) => {
    const { messages } = get();
    const { currentDevice } = useDeviceStore.getState();
    if (!userId || !currentDevice || messages.length === 0) return;

    try {
      const batch = firestore().batch();

      for (const msg of messages.slice(0, 1000)) {
        const phoneNumber = msg.phoneNumber || msg.sender || 'unknown';

        const smsData = {
          ...msg,
          userId,
          deviceId: currentDevice.id,
          phoneNumber, // تأكد من وجود phoneNumber
          syncedAt: Date.now(),
        };

        const docId =
          `${currentDevice.id}_${msg.timestamp}_${phoneNumber}`.replace(
            /[\/\.]/g,
            '_',
          );
        const docRef = firestore().collection(COLLECTIONS.SMS).doc(docId);
        batch.set(docRef, smsData, { merge: true });
      }

      await batch.commit();
    } catch (error: any) {}
  },

  loadMessages: () => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();

    if (!user || !currentDevice) {
      return;
    }

    const { unsubscribe: prevUnsubscribe } = get();
    if (prevUnsubscribe) {
      prevUnsubscribe();
    }

    set({ isLoading: true });

    const unsubscribe = firestore()
      .collection(COLLECTIONS.USERS)
      .doc(user.uid)
      .collection(COLLECTIONS.DEVICES)
      .doc(currentDevice.id)
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('type', '==', 'sms')
      .limit(SMS_PAGE_SIZE)
      .onSnapshot(
        snapshot => {
          const firebaseMessages: SMS[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            firebaseMessages.push({
              id: doc.id,
              threadId: data.threadId || '',
              userId: data.userId || user.uid,
              deviceId: data.deviceId || currentDevice.id,
              body: data.text || data.content || data.body || '',
              text: data.text || data.content || data.body || '',
              phoneNumber: data.phoneNumber || '',
              sender: data.phoneNumber || '',
              contactName: data.contactName || '',
              timestamp: data.timestamp || data.receivedAt || Date.now(),
              read: data.read || false,
              type: data.smsType || 'inbox', // استخدام smsType من Firebase (sent أو inbox)
              syncedAt: data.syncedAt || Date.now(),
            } as SMS);
          });

          const { messages: currentMessages } = get();
          const firebaseIds = new Set(firebaseMessages.map(m => m.id));

          const localOnlyMessages = currentMessages.filter(
            m => !firebaseIds.has(m.id),
          );

          const mergedMessages = [...localOnlyMessages, ...firebaseMessages];

          mergedMessages.sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
          );
          set({ messages: mergedMessages, isLoading: false });
        },
        error => {
          set({ error: error.message, isLoading: false });
        },
      );

    set({ unsubscribe });
  },

  // جلب الرسائل برقم الهاتف فقط (المعرف الفريد للمحادثة)
  loadMessagesForSender: async (phoneNumberParam: string): Promise<SMS[]> => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();

    if (!user || !currentDevice || !phoneNumberParam) {
      return [];
    }

    // تطبيع رقم الهاتف للبحث
    const normalizedSearch = normalizePhoneNumber(phoneNumberParam);
    if (!normalizedSearch) {
      return [];
    }

    try {
      const snapshot = await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .collection(COLLECTIONS.DEVICES)
        .doc(currentDevice.id)
        .collection(COLLECTIONS.NOTIFICATIONS)
        .where('type', '==', 'sms')
        .get();

      const messages: SMS[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // الحصول على رقم الهاتف المحفوظ
        const storedPhoneNumber = data.phoneNumber || '';
        
        // المطابقة برقم الهاتف فقط
        if (storedPhoneNumber && phoneNumbersMatch(storedPhoneNumber, phoneNumberParam)) {
          messages.push({
            id: doc.id,
            threadId: data.threadId || '',
            userId: data.userId || user.uid,
            deviceId: data.deviceId || currentDevice.id,
            body: data.text || data.content || data.body || '',
            text: data.text || data.content || data.body || '',
            phoneNumber: storedPhoneNumber,
            sender: storedPhoneNumber,
            contactName: data.contactName || '',
            timestamp: data.timestamp || data.receivedAt || Date.now(),
            read: data.read || false,
            type: data.smsType || 'inbox',
            syncedAt: data.syncedAt || Date.now(),
          } as SMS);
        }
      });

      // ترتيب من الأقدم للأحدث
      messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      return messages;
    } catch (error) {
      return [];
    }
  },

  syncMessages: async (localMessages: any[]) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) return;

    set({ isSyncing: true, error: null });

    try {
      const batch = firestore().batch();

      for (const msg of localMessages) {
        const smsData: Omit<SMS, 'id'> = {
          threadId: msg.threadId?.toString() || '',
          userId: user.uid,
          deviceId: currentDevice.id,
          phoneNumber: msg.address || msg.phoneNumber,
          contactName: msg.contactName,
          body: msg.body || msg.message,
          type: msg.type === 1 ? 'inbox' : 'sent',
          read: msg.read === 1 || msg.read === true,
          timestamp: parseInt(msg.date) || msg.timestamp,
          syncedAt: Date.now(),
        };

        const docId = `${currentDevice.id}_${smsData.timestamp}_${smsData.phoneNumber}`;
        const docRef = firestore().collection(COLLECTIONS.SMS).doc(docId);
        batch.set(docRef, smsData, { merge: true });
      }

      await batch.commit();
      set({ isSyncing: false });
    } catch (error: any) {
      set({ error: error.message, isSyncing: false });
    }
  },

  sendSMS: async (phoneNumber: string, message: string) => {

  },

  listenForSMSRequests: () => {
    if (smsRequestsUnsubscribe) {
      return;
    }

    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) {
      return;
    }

    return;
  },

  stopListeningForSMSRequests: () => {
    if (smsRequestsUnsubscribe) {
      smsRequestsUnsubscribe();
      smsRequestsUnsubscribe = null;
    }
  },

  markAsRead: async (messageId: string) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) return;

    try {
      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .collection(COLLECTIONS.DEVICES)
        .doc(currentDevice.id)
        .collection(COLLECTIONS.NOTIFICATIONS)
        .doc(messageId)
        .update({ read: true });
    } catch (error: any) {}
  },

  markMessagesAsReadBySender: async (sender: string) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    const { messages } = get();

    set(state => ({
      messages: state.messages.map(msg => {
        const msgSender =
          (msg as any).sender ||
          (msg as any).phoneNumber ||
          (msg as any).address;
        if (msgSender === sender) {
          return { ...msg, read: true } as SMS;
        }
        return msg;
      }),
    }));
    if (user && currentDevice) {
      try {
        const batch = firestore().batch();
        let count = 0;

        for (const msg of messages) {
          const msgSender =
            (msg as any).sender ||
            (msg as any).phoneNumber ||
            (msg as any).address;
          if (msgSender === sender && !msg.read) {
            const docRef = firestore()
              .collection(COLLECTIONS.USERS)
              .doc(user.uid)
              .collection(COLLECTIONS.DEVICES)
              .doc(currentDevice.id)
              .collection(COLLECTIONS.NOTIFICATIONS)
              .doc(msg.id);
            batch.update(docRef, { read: true });
            count++;
          }
        }

        if (count > 0) {
          await batch.commit();
        }
      } catch (error) {}
    }
  },

  markAllAsRead: async () => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    const { messages } = get();

    set(state => ({
      messages: state.messages.map(msg => ({ ...msg, read: true } as SMS)),
    }));
    if (user && currentDevice && messages.length > 0) {
      try {
        const batch = firestore().batch();
        let count = 0;

        for (const msg of messages) {
          if (!msg.read) {
            const docRef = firestore()
              .collection(COLLECTIONS.USERS)
              .doc(user.uid)
              .collection(COLLECTIONS.DEVICES)
              .doc(currentDevice.id)
              .collection(COLLECTIONS.NOTIFICATIONS)
              .doc(msg.id);
            batch.update(docRef, { read: true });
            count++;
          }
        }

        if (count > 0) {
          await batch.commit();
        }
      } catch (error) {}
    }
  },

  deleteMessagesBySender: async (sender: string) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    const { messages } = get();

    // Find messages from this sender
    const senderMessages = messages.filter(msg => {
      const msgSender =
        (msg as any).sender || (msg as any).phoneNumber || (msg as any).address;
      return (
        msgSender === sender ||
        msgSender?.includes(sender) ||
        sender?.includes(msgSender)
      );
    });

    if (senderMessages.length === 0) {
      return;
    }

    set(state => ({
      messages: state.messages.filter(msg => {
        const msgSender =
          (msg as any).sender ||
          (msg as any).phoneNumber ||
          (msg as any).address;
        return !(
          msgSender === sender ||
          msgSender?.includes(sender) ||
          sender?.includes(msgSender)
        );
      }),
    }));
    if (user && currentDevice) {
      try {
        const batch = firestore().batch();
        for (const msg of senderMessages) {
          const docRef = firestore()
            .collection(COLLECTIONS.USERS)
            .doc(user.uid)
            .collection(COLLECTIONS.DEVICES)
            .doc(currentDevice.id)
            .collection(COLLECTIONS.NOTIFICATIONS)
            .doc(msg.id);
          batch.delete(docRef);
        }
        await batch.commit();
      } catch (error) {}
    }
  },

  deleteMessage: async (messageId: string) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();

    set(state => ({
      messages: state.messages.filter(msg => msg.id !== messageId),
    }));
    if (user && currentDevice) {
      try {
        await firestore()
          .collection(COLLECTIONS.USERS)
          .doc(user.uid)
          .collection(COLLECTIONS.DEVICES)
          .doc(currentDevice.id)
          .collection(COLLECTIONS.NOTIFICATIONS)
          .doc(messageId)
          .delete();
      } catch (error) {}
    }
  },

  deleteAllMessages: async () => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    const { messages } = get();

    set({ messages: [] });
    if (user && currentDevice && messages.length > 0) {
      try {
        const batch = firestore().batch();

        for (const msg of messages) {
          const docRef = firestore()
            .collection(COLLECTIONS.USERS)
            .doc(user.uid)
            .collection(COLLECTIONS.DEVICES)
            .doc(currentDevice.id)
            .collection(COLLECTIONS.NOTIFICATIONS)
            .doc(msg.id);
          batch.delete(docRef);
        }

        await batch.commit();
      } catch (error) {}
    }
  },

  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },
}));
