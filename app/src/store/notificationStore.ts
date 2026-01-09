import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification } from '../services/notificationService';
import firestore from '@react-native-firebase/firestore';

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (notification: AppNotification) => void;
  removeNotification: (id: string) => void;
  removeNotificationsByKeys: (keys: string[]) => void;
  markAsRead: (ids: string[]) => void;
  markGroupAsRead: (title: string, appName: string, type: string) => void;
  clearNotifications: () => void;
  getNotificationsByType: (type: string) => AppNotification[];
  getUnreadCount: (title: string, appName: string, type: string) => number;
  syncFromFirebase: (userId: string) => Promise<void>;
  cleanup: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      addNotification: (notification: AppNotification) => {
        set(state => {
          const uniqueId = `${notification.key}_${notification.timestamp}`;

          console.log(
            '[NotificationStore] Adding notification with uniqueId:',
            uniqueId,
          );
          console.log(
            '[NotificationStore] Current count:',
            state.notifications.length,
          );

          const exists = state.notifications.find(n => n.id === uniqueId);
          if (exists) {
            console.log('[NotificationStore] Duplicate found, skipping');
            return state;
          }

          const notificationWithId = {
            ...notification,
            id: uniqueId,
            read: false,
          };

          const updated = [notificationWithId, ...state.notifications].slice(
            0,
            500,
          );
          console.log('[NotificationStore] New count:', updated.length);
          return { notifications: updated };
        });
      },

      removeNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id),
        }));
      },

      removeNotificationsByKeys: (keys: string[]) => {
        set(state => ({
          notifications: state.notifications.filter(n => {
            // Check if notification's group key matches any of the keys to delete
            const notificationGroupKey = `${n.title}_${n.appName}_${n.type}`;
            return !keys.includes(notificationGroupKey);
          }),
        }));
      },

      markAsRead: (ids: string[]) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            ids.includes(n.id) ? { ...n, read: true } : n,
          ),
        }));
      },

      markGroupAsRead: (title: string, appName: string, type: string) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.title === title && n.appName === appName && n.type === type
              ? { ...n, read: true }
              : n,
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      getNotificationsByType: (type: string) => {
        return get().notifications.filter(n => n.type === type);
      },

      getUnreadCount: (title: string, appName: string, type: string) => {
        return get().notifications.filter(
          n =>
            n.title === title &&
            n.appName === appName &&
            n.type === type &&
            !n.read,
        ).length;
      },

      syncFromFirebase: async (userId: string) => {
        try {
          const snapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('notifications')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

          const firebaseNotifications: AppNotification[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            firebaseNotifications.push({
              id: doc.id,
              key: data.key,
              packageName: data.packageName,
              title: data.title,
              text: data.text,
              type: data.type,
              timestamp: data.timestamp,
              appName: data.appName,
              read: data.read ?? false,
            });
          });

          set(state => {
            const merged = [...firebaseNotifications];
            state.notifications.forEach(n => {
              if (!merged.find(m => m.id === n.id)) {
                merged.push(n);
              }
            });
            merged.sort((a, b) => b.timestamp - a.timestamp);
            return { notifications: merged.slice(0, 500) };
          });

          console.log(
            '[NotificationStore] Synced from Firebase:',
            firebaseNotifications.length,
          );
        } catch (error) {
          console.error(
            '[NotificationStore] Error syncing from Firebase:',
            error,
          );
        }
      },

      cleanup: () => {
        set({ notifications: [] });
        console.log('[NotificationStore] Cleaned up');
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
