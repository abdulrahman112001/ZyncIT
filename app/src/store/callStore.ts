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
  clearAllCalls: () => Promise<void>;
  deleteCallsByPhoneNumbers: (phoneNumbers: string[]) => Promise<void>;
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

        // إزالة القيم undefined التي لا يقبلها Firestore
        const callData: Record<string, any> = {
          id: call.id,
          userId,
          deviceId: currentDevice.id,
          deviceName:
            currentDevice.nickname || currentDevice.name || 'Android Device',
          phoneNumber,
          contactName: call.contactName || null,
          type: call.type || 'incoming',
          duration: call.duration || 0,
          timestamp: call.timestamp || Date.now(),
          syncedAt: Date.now(),
        };

        const docId = `${call.timestamp}_${phoneNumber}`.replace(
          /[\/\.]/g,
          '_',
        );
        await firestore()
          .collection(COLLECTIONS.USERS)
          .doc(userId)
          .collection(COLLECTIONS.DEVICES)
          .doc(currentDevice.id)
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

        // إزالة القيم undefined التي لا يقبلها Firestore
        const callData: Record<string, any> = {
          id: call.id,
          userId,
          deviceId: currentDevice.id,
          deviceName:
            currentDevice.nickname || currentDevice.name || 'Android Device',
          phoneNumber,
          contactName: call.contactName || null,
          type: call.type || 'incoming',
          duration: call.duration || 0,
          timestamp: call.timestamp || Date.now(),
          syncedAt: Date.now(),
        };

        const docId = `${call.timestamp}_${phoneNumber}`.replace(/[\/.]/g, '_');
        const docRef = firestore()
          .collection(COLLECTIONS.USERS)
          .doc(userId)
          .collection(COLLECTIONS.DEVICES)
          .doc(currentDevice.id)
          .collection(COLLECTIONS.CALLS)
          .doc(docId);
        batch.set(docRef, callData, { merge: true });
      }

      await batch.commit();
      console.log(`✅ Synced ${calls.length} calls to Firebase`);
    } catch (error: any) {
      console.error('❌ Error syncing calls to Firebase:', error);
    }
  },

  loadCalls: async () => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) return;

    // Unsubscribe from previous listener
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
      .collection(COLLECTIONS.CALLS)
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

        const docId = `${callData.timestamp}_${callData.phoneNumber}`;
        const docRef = firestore()
          .collection(COLLECTIONS.USERS)
          .doc(user.uid)
          .collection(COLLECTIONS.DEVICES)
          .doc(currentDevice.id)
          .collection(COLLECTIONS.CALLS)
          .doc(docId);
        batch.set(docRef, callData, { merge: true });
      }

      await batch.commit();
      set({ isSyncing: false });
    } catch (error: any) {
      set({ error: error.message, isSyncing: false });
    }
  },

  clearAllCalls: async () => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    if (!user || !currentDevice) return;

    try {
      // Get all calls for this device
      const snapshot = await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .collection(COLLECTIONS.DEVICES)
        .doc(currentDevice.id)
        .collection(COLLECTIONS.CALLS)
        .get();

      // Delete in batches
      const batch = firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Clear local state
      set({ calls: [] });
      console.log('✅ All calls deleted');
    } catch (error) {
      console.error('❌ Error deleting calls:', error);
    }
  },

  deleteCallsByPhoneNumbers: async (phoneNumbers: string[]) => {
    const { user } = useAuthStore.getState();
    const { currentDevice } = useDeviceStore.getState();
    const { calls } = get();
    if (!user || !currentDevice || phoneNumbers.length === 0) return;

    try {
      // Get calls for these phone numbers
      const snapshot = await firestore()
        .collection(COLLECTIONS.USERS)
        .doc(user.uid)
        .collection(COLLECTIONS.DEVICES)
        .doc(currentDevice.id)
        .collection(COLLECTIONS.CALLS)
        .get();

      // Filter docs that match the phone numbers
      const docsToDelete = snapshot.docs.filter(doc => {
        const data = doc.data();
        return phoneNumbers.includes(data.phoneNumber);
      });

      // Delete in batches (Firestore limit is 500 per batch)
      const batchSize = 500;
      for (let i = 0; i < docsToDelete.length; i += batchSize) {
        const batch = firestore().batch();
        const chunk = docsToDelete.slice(i, i + batchSize);
        chunk.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }

      // Update local state
      const updatedCalls = calls.filter(
        call => !phoneNumbers.includes(call.phoneNumber),
      );
      set({ calls: updatedCalls });
      console.log(`✅ Deleted calls for ${phoneNumbers.length} phone numbers`);
    } catch (error) {
      console.error('❌ Error deleting selected calls:', error);
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
