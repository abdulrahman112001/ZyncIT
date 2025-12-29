import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { SMS, SendSMSRequest } from '../types';
import { COLLECTIONS, SMS_PAGE_SIZE } from '../constants';
import { useAuthStore } from './authStore';
import { useDeviceStore } from './deviceStore';

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
  markAsRead: (messageId: string) => Promise<void>;
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
    const { currentDevice } = useDeviceStore.getState();

    // تجنب التكرار
    if (!messages.find(m => m.id === message.id)) {
      set({ messages: [message, ...messages] });
    }

    // حفظ في Firebase فوراً
    if (userId && currentDevice) {
      try {
        const phoneNumber =
          (message as any).phoneNumber || (message as any).sender || 'unknown';
        const smsData = {
          ...message,
          userId,
          deviceId: currentDevice.id,
          phoneNumber,
          syncedAt: Date.now(),
        };

        const docId =
          `${currentDevice.id}_${message.timestamp}_${phoneNumber}`.replace(
            /[\/\.]/g,
            '_',
          );
        await firestore()
          .collection(COLLECTIONS.SMS)
          .doc(docId)
          .set(smsData, { merge: true });
        console.log('✅ SMS saved to Firebase immediately:', phoneNumber);
      } catch (error) {
        console.error('❌ Error saving SMS to Firebase:', error);
      }
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
    if (!user) return;

    // Unsubscribe from previous listener
    const { unsubscribe: prevUnsubscribe } = get();
    if (prevUnsubscribe) {
      prevUnsubscribe();
    }

    set({ isLoading: true });

    const unsubscribe = firestore()
      .collection(COLLECTIONS.SMS)
      .where('userId', '==', user.uid)
      .orderBy('timestamp', 'desc')
      .limit(SMS_PAGE_SIZE)
      .onSnapshot(
        snapshot => {
          const messages: SMS[] = [];
          snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data() } as SMS);
          });
          set({ messages, isLoading: false });
        },
        error => {
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
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) return;

    // Listen for SMS requests from other devices (like Chrome extension)
    firestore()
      .collection(COLLECTIONS.SMS_REQUESTS)
      .where('toDeviceId', '==', currentDevice.id)
      .where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            const request = change.doc.data() as SendSMSRequest;

            // Send the SMS
            try {
              // Use native SMS module to send
              // await NativeSMS.send(request.phoneNumber, request.message);

              // Update request status
              await firestore()
                .collection(COLLECTIONS.SMS_REQUESTS)
                .doc(change.doc.id)
                .update({ status: 'sent' });
            } catch (error) {
              await firestore()
                .collection(COLLECTIONS.SMS_REQUESTS)
                .doc(change.doc.id)
                .update({ status: 'failed' });
            }
          }
        });
      });
  },

  markAsRead: async (messageId: string) => {
    try {
      await firestore()
        .collection(COLLECTIONS.SMS)
        .doc(messageId)
        .update({ read: true });
    } catch (error: any) {
      console.error('Error marking message as read:', error);
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
