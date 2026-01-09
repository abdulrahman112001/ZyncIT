import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { NativeModules } from 'react-native';
import { SMS, SendSMSRequest } from '../types';
import { COLLECTIONS, SMS_PAGE_SIZE } from '../constants';
import { useAuthStore } from './authStore';
import { useDeviceStore } from './deviceStore';

const { SmsModule } = NativeModules;

// Track if SMS requests listener is already active
let smsRequestsUnsubscribe: (() => void) | null = null;

interface SMSState {
  messages: SMS[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  // Actions
  loadMessages: () => void;
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
      console.log(
        '📥 SMS added to store, total messages:',
        messages.length + 1,
      );
    } else {
      console.log('⚠️ SMS already exists in store:', message.id);
    }

    // If no currentDevice, try to register it first
    if (!currentDevice && userId) {
      console.log('📱 No currentDevice found, attempting to register...');
      try {
        await useDeviceStore.getState().registerDevice();
        currentDevice = useDeviceStore.getState().currentDevice;
        console.log('📱 Device registered:', currentDevice?.id);
      } catch (e) {
        console.error('❌ Failed to register device:', e);
      }
    }

    // حفظ في Firebase كإشعار (في نفس مسار الإشعارات)
    if (userId && currentDevice) {
      try {
        const phoneNumber =
          (message as any).phoneNumber || (message as any).sender || 'unknown';
        const contactName = (message as any).contactName || '';

        // تحويل SMS إلى صيغة إشعار
        const notificationData = {
          id: message.id,
          key: `sms_${message.id}`,
          packageName: 'com.android.mms',
          title: contactName || phoneNumber,
          text: message.body || message.text || '',
          content: message.body || message.text || '',
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

        const docId =
          `sms_${currentDevice.id}_${message.timestamp}_${phoneNumber}`.replace(
            /[\/\.]/g,
            '_',
          );

        // حفظ في مسار الإشعارات: users/{userId}/devices/{deviceId}/notifications
        await firestore()
          .collection(COLLECTIONS.USERS)
          .doc(userId)
          .collection(COLLECTIONS.DEVICES)
          .doc(currentDevice.id)
          .collection(COLLECTIONS.NOTIFICATIONS)
          .doc(docId)
          .set(notificationData, { merge: true });

        console.log('✅ SMS saved as notification in Firebase:', phoneNumber);
      } catch (error) {
        console.error('❌ Error saving SMS to Firebase:', error);
      }
    } else {
      console.warn(
        '⚠️ SMS NOT saved to Firebase - userId:',
        userId,
        'currentDevice:',
        currentDevice?.id || 'null',
      );
    }
  },

  syncMessagesToFirebase: async (userId: string) => {
    const { messages } = get();
    const { currentDevice } = useDeviceStore.getState();
    if (!userId || !currentDevice || messages.length === 0) return;

    try {
      const batch = firestore().batch();

      for (const msg of messages.slice(0, 50)) {
        // آخر 50 رسالة فقط
        // استخدام sender أو phoneNumber (للتوافق)
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
      console.log(`✅ Synced ${messages.length} SMS to Firebase`);
    } catch (error: any) {
      console.error('❌ Error syncing SMS to Firebase:', error);
    }
  },

  loadMessages: () => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();

    console.log(
      '📱 loadMessages called - user:',
      user?.uid,
      'device:',
      currentDevice?.id,
    );

    if (!user || !currentDevice) {
      console.log('⚠️ loadMessages: Missing user or device, skipping');
      return;
    }

    // Unsubscribe from previous listener
    const { unsubscribe: prevUnsubscribe } = get();
    if (prevUnsubscribe) {
      prevUnsubscribe();
    }

    set({ isLoading: true });

    // قراءة SMS من مسار الإشعارات مع فلتر type === 'sms'
    // ملاحظة: تم إزالة orderBy لتجنب الحاجة لـ composite index في Firebase
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
              phoneNumber: data.phoneNumber || data.title || '',
              sender: data.phoneNumber || data.title || '',
              contactName: data.contactName || '',
              timestamp: data.timestamp || data.receivedAt || Date.now(),
              read: data.read || false,
              type: data.smsType || 'inbox', // استخدام smsType من Firebase (sent أو inbox)
              syncedAt: data.syncedAt || Date.now(),
            } as SMS);
          });
          
          // دمج الرسائل المحلية الجديدة مع رسائل Firebase
          const { messages: currentMessages } = get();
          const firebaseIds = new Set(firebaseMessages.map(m => m.id));
          
          // الاحتفاظ بالرسائل المحلية التي لم تُحفظ بعد في Firebase
          const localOnlyMessages = currentMessages.filter(m => !firebaseIds.has(m.id));
          
          // دمج الرسائل
          const mergedMessages = [...localOnlyMessages, ...firebaseMessages];
          
          // ترتيب محلياً بعد جلب البيانات
          mergedMessages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          console.log('📬 SMS loaded from Firebase:', firebaseMessages.length, '| Local only:', localOnlyMessages.length, '| Total:', mergedMessages.length);
          set({ messages: mergedMessages, isLoading: false });
        },
        error => {
          console.error('❌ Error loading SMS:', error);
          set({ error: error.message, isLoading: false });
        },
      );

    set({ unsubscribe });
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
    // This would use react-native-sms or similar to send actual SMS
    // For now, we just log the request
    console.log('Sending SMS to', phoneNumber, ':', message);
  },

  listenForSMSRequests: () => {
    // Prevent multiple listeners
    if (smsRequestsUnsubscribe) {
      console.log('📡 SMS requests listener already active, skipping...');
      return;
    }

    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) {
      console.log('❌ Cannot listen for SMS requests - no user or device');
      return;
    }

    // NOTE: SmsRequestService.java handles SMS sending in background
    // We only need to listen here when the app is in foreground and service is not running
    // To avoid duplicates, we'll skip this listener since the service handles everything
    console.log(
      '📡 SMS requests handled by SmsRequestService - skipping JS listener for device:',
      currentDevice.id,
    );

    // Commenting out to avoid duplicate SMS sends and saves
    // The SmsRequestService.java foreground service handles this
    return;
  },

  stopListeningForSMSRequests: () => {
    if (smsRequestsUnsubscribe) {
      console.log('📡 Stopping SMS requests listener');
      smsRequestsUnsubscribe();
      smsRequestsUnsubscribe = null;
    }
  },

  markAsRead: async (messageId: string) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) return;

    try {
      // تحديث في Firebase (مسار الإشعارات)
      await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .collection(COLLECTIONS.DEVICES)
        .doc(currentDevice.id)
        .collection(COLLECTIONS.NOTIFICATIONS)
        .doc(messageId)
        .update({ read: true });
      console.log('📖 Marked message as read in Firebase:', messageId);
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  },

  markMessagesAsReadBySender: async (sender: string) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    const { messages } = get();

    // تحديث محلي
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
    console.log('📖 Marked all messages from', sender, 'as read locally');

    // تحديث في Firebase
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
          console.log('✅ Marked', count, 'messages as read in Firebase');
        }
      } catch (error) {
        console.error('❌ Error marking messages as read in Firebase:', error);
      }
    }
  },

  // تحديد جميع الرسائل كمقروءة
  markAllAsRead: async () => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    const { messages } = get();

    // تحديث محلي
    set(state => ({
      messages: state.messages.map(msg => ({ ...msg, read: true } as SMS)),
    }));
    console.log('📖 Marked all messages as read locally');

    // تحديث في Firebase
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
          console.log('✅ Marked all', count, 'messages as read in Firebase');
        }
      } catch (error) {
        console.error('❌ Error marking all messages as read:', error);
      }
    }
  },

  // حذف رسائل حسب المرسل
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
      console.log('⚠️ No messages found for sender:', sender);
      return;
    }

    // حذف من المتجر المحلي
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
    console.log(
      `🗑️ Deleted ${senderMessages.length} messages locally for sender:`,
      sender,
    );

    // حذف من Firebase
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
        console.log(
          `✅ Deleted ${senderMessages.length} messages from Firebase`,
        );
      } catch (error) {
        console.error('❌ Error deleting messages by sender:', error);
      }
    }
  },

  // حذف رسالة واحدة
  deleteMessage: async (messageId: string) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();

    // حذف من المتجر المحلي
    set(state => ({
      messages: state.messages.filter(msg => msg.id !== messageId),
    }));
    console.log('🗑️ Message deleted locally:', messageId);

    // حذف من Firebase
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
        console.log('✅ Message deleted from Firebase:', messageId);
      } catch (error) {
        console.error('❌ Error deleting message:', error);
      }
    }
  },

  // حذف جميع الرسائل
  deleteAllMessages: async () => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    const { messages } = get();

    // حذف من المتجر المحلي
    set({ messages: [] });
    console.log('🗑️ All messages deleted locally');

    // حذف من Firebase
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
        console.log(
          '✅ All',
          messages.length,
          'messages deleted from Firebase',
        );
      } catch (error) {
        console.error('❌ Error deleting all messages:', error);
      }
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
