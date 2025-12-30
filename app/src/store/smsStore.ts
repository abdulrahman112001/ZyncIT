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
      console.log(
        '📥 SMS added to store, total messages:',
        messages.length + 1,
      );
    } else {
      console.log('⚠️ SMS already exists in store:', message.id);
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
          timestamp: message.timestamp,
          receivedAt: message.timestamp,
          read: message.read || false,
          userId,
          deviceId: currentDevice.id,
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
          const messages: SMS[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            messages.push({
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
              type: 'inbox',
              syncedAt: data.syncedAt || Date.now(),
            } as SMS);
          });
          // ترتيب محلياً بعد جلب البيانات
          messages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          console.log('📬 SMS loaded from Firebase:', messages.length);
          set({ messages, isLoading: false });
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

    console.log(
      '📡 Starting SMS requests listener for device:',
      currentDevice.id,
    );

    // Listen for SMS requests from other devices (like Chrome extension)
    smsRequestsUnsubscribe = firestore()
      .collection(COLLECTIONS.SMS_REQUESTS)
      .where('toDeviceId', '==', currentDevice.id)
      .where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        console.log(
          '📨 SMS requests snapshot received, changes:',
          snapshot.docChanges().length,
        );
        snapshot.docChanges().forEach(async change => {
          console.log('📨 SMS request change type:', change.type);
          if (change.type === 'added') {
            const request = change.doc.data() as SendSMSRequest;
            console.log(
              '📨 New SMS request:',
              request.phoneNumber,
              request.message,
            );

            // Send the SMS using native module
            try {
              if (SmsModule) {
                await SmsModule.sendSms(request.phoneNumber, request.message);
                console.log('📤 SMS sent to:', request.phoneNumber);

                // Save sent message to notifications collection
                const sentMessage = {
                  type: 'sms',
                  phoneNumber: request.phoneNumber,
                  contactName: request.phoneNumber, // Will be the phone number for sent messages
                  body: request.message,
                  timestamp: Date.now(),
                  read: true,
                  direction: 'outgoing', // Mark as sent message
                };

                await firestore()
                  .collection(COLLECTIONS.USERS)
                  .doc(user.uid)
                  .collection(COLLECTIONS.DEVICES)
                  .doc(currentDevice.id)
                  .collection(COLLECTIONS.NOTIFICATIONS)
                  .add(sentMessage);

                console.log('💾 Sent message saved to Firebase');
              }

              // Update request status
              await firestore()
                .collection(COLLECTIONS.SMS_REQUESTS)
                .doc(change.doc.id)
                .update({ status: 'sent' });
            } catch (error) {
              console.error('❌ SMS send error:', error);
              await firestore()
                .collection(COLLECTIONS.SMS_REQUESTS)
                .doc(change.doc.id)
                .update({ status: 'failed' });
            }
          }
        });
      });
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
  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },
}));
