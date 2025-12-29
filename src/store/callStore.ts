import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { CallLog } from '../types';
import { COLLECTIONS, CALL_PAGE_SIZE } from '../constants';
import { useAuthStore } from './authStore';
import { useDeviceStore } from './deviceStore';

interface CallState {
  calls: CallLog[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  // Actions
  loadCalls: () => void;
  setCalls: (calls: CallLog[]) => void;
  addCall: (call: CallLog) => void;
  addCallAndSync: (call: CallLog, userId: string) => Promise<void>;
  syncCalls: (localCalls: any[]) => Promise<void>;
  syncCallsToFirebase: (userId: string) => Promise<void>;
  cleanup: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  calls: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  unsubscribe: null,

  setCalls: (calls: CallLog[]) => {
    set({ calls });
  },

  addCall: (call: CallLog) => {
    const { calls } = get();
    // تجنب التكرار
    if (!calls.find(c => c.id === call.id)) {
      set({ calls: [call, ...calls] });
    }
  },

  // إضافة مكالمة وحفظها في Firebase مباشرة
  addCallAndSync: async (call: CallLog, userId: string) => {
    const { calls } = get();
    const { currentDevice } = useDeviceStore.getState();

    // تجنب التكرار
    if (!calls.find(c => c.id === call.id)) {
      set({ calls: [call, ...calls] });
    }

    // حفظ في Firebase فوراً
    if (userId && currentDevice) {
      try {
        const phoneNumber =
          (call as any).phoneNumber || (call as any).number || 'unknown';
        const callData = {
          ...call,
          userId,
          deviceId: currentDevice.id,
          phoneNumber,
          syncedAt: Date.now(),
        };

        const docId =
          `${currentDevice.id}_${call.timestamp}_${phoneNumber}`.replace(
            /[\/\.]/g,
            '_',
          );
        await firestore()
          .collection(COLLECTIONS.CALLS)
          .doc(docId)
          .set(callData, { merge: true });
        console.log('✅ Call saved to Firebase immediately:', phoneNumber);
      } catch (error) {
        console.error('❌ Error saving call to Firebase:', error);
      }
    }
  },

  syncCallsToFirebase: async (userId: string) => {
    const { calls } = get();
    const { currentDevice } = useDeviceStore.getState();
    if (!userId || !currentDevice || calls.length === 0) return;

    try {
      const batch = firestore().batch();

      for (const call of calls.slice(0, 50)) {
        // آخر 50 مكالمة فقط
        // استخدام number أو phoneNumber (للتوافق)
        const phoneNumber = call.phoneNumber || call.number || 'unknown';

        const callData = {
          ...call,
          userId,
          deviceId: currentDevice.id,
          phoneNumber, // تأكد من وجود phoneNumber
          syncedAt: Date.now(),
        };

        const docId =
          `${currentDevice.id}_${call.timestamp}_${phoneNumber}`.replace(
            /[\/\.]/g,
            '_',
          );
        const docRef = firestore().collection(COLLECTIONS.CALLS).doc(docId);
        batch.set(docRef, callData, { merge: true });
      }

      await batch.commit();
      console.log(`✅ Synced ${calls.length} calls to Firebase`);
    } catch (error: any) {
      console.error('❌ Error syncing calls to Firebase:', error);
    }
  },

  loadCalls: () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    // Unsubscribe from previous listener
    const { unsubscribe: prevUnsubscribe } = get();
    if (prevUnsubscribe) {
      prevUnsubscribe();
    }

    set({ isLoading: true });

    const unsubscribe = firestore()
      .collection(COLLECTIONS.CALLS)
      .where('userId', '==', user.uid)
      .orderBy('timestamp', 'desc')
      .limit(CALL_PAGE_SIZE)
      .onSnapshot(
        snapshot => {
          const calls: CallLog[] = [];
          snapshot.forEach(doc => {
            calls.push({ id: doc.id, ...doc.data() } as CallLog);
          });
          set({ calls, isLoading: false });
        },
        error => {
          set({ error: error.message, isLoading: false });
        },
      );

    set({ unsubscribe });
  },

  syncCalls: async (localCalls: any[]) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) return;

    set({ isSyncing: true, error: null });

    try {
      const batch = firestore().batch();

      for (const call of localCalls) {
        // Map call type
        let callType: CallLog['type'] = 'incoming';
        switch (call.type) {
          case 1:
          case 'INCOMING':
            callType = 'incoming';
            break;
          case 2:
          case 'OUTGOING':
            callType = 'outgoing';
            break;
          case 3:
          case 'MISSED':
            callType = 'missed';
            break;
          case 5:
          case 'REJECTED':
            callType = 'rejected';
            break;
        }

        const callData: Omit<CallLog, 'id'> = {
          userId: user.uid,
          deviceId: currentDevice.id,
          phoneNumber: call.phoneNumber || call.number,
          contactName: call.name || call.contactName,
          type: callType,
          duration: parseInt(call.duration) || 0,
          timestamp:
            parseInt(call.dateTime) || parseInt(call.timestamp) || Date.now(),
          syncedAt: Date.now(),
        };

        const docId = `${currentDevice.id}_${callData.timestamp}_${callData.phoneNumber}`;
        const docRef = firestore().collection(COLLECTIONS.CALLS).doc(docId);
        batch.set(docRef, callData, { merge: true });
      }

      await batch.commit();
      set({ isSyncing: false });
    } catch (error: any) {
      set({ error: error.message, isSyncing: false });
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
