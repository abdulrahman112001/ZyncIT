import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  EmitterSubscription,
  PermissionsAndroid,
} from 'react-native';

const { NotificationModule } = NativeModules;

export interface AppNotification {
  id: string;
  key: string;
  packageName: string;
  title: string;
  text: string;
  type: 'sms' | 'call' | 'whatsapp' | 'telegram' | 'other';
  timestamp: number;
  appName: string;
  read: boolean;
}

class NotificationServiceClass {
  private eventEmitter: NativeEventEmitter | null = null;
  private listeners: EmitterSubscription[] = [];

  constructor() {
    if (Platform.OS === 'android' && NotificationModule) {
      this.eventEmitter = new NativeEventEmitter(NotificationModule);
    }
  }

  async isPermissionGranted(): Promise<boolean> {
    if (Platform.OS !== 'android' || !NotificationModule) {
      return false;
    }
    try {
      return await NotificationModule.isPermissionGranted();
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  async openSettings(): Promise<void> {
    if (Platform.OS !== 'android' || !NotificationModule) {
      return;
    }
    try {
      await NotificationModule.openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  }

  async isServiceConnected(): Promise<boolean> {
    if (Platform.OS !== 'android' || !NotificationModule) {
      return false;
    }
    try {
      return await NotificationModule.isServiceConnected();
    } catch (error) {
      console.error('Error checking service:', error);
      return false;
    }
  }

  async requestSMSPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        {
          title: 'SMS Permission',
          message: 'ZyncIT needs permission to send SMS messages.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      return false;
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (Platform.OS !== 'android' || !NotificationModule) {
      return false;
    }
    try {
      return await NotificationModule.sendSMS(phoneNumber, message);
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  onNotificationReceived(
    callback: (notification: AppNotification) => void,
  ): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener(
      'onNotificationReceived',
      (data: any) => {
        const notification: AppNotification = {
          id: data.id,
          key: data.key,
          packageName: data.packageName,
          title: data.title || '',
          text: data.text || '',
          type: data.type || 'other',
          timestamp: data.timestamp || Date.now(),
          appName: data.appName || data.packageName,
          read: false,
        };
        callback(notification);
      },
    );

    this.listeners.push(subscription);
    return () => subscription.remove();
  }

  onNotificationRemoved(
    callback: (data: { key: string; packageName: string }) => void,
  ): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener(
      'onNotificationRemoved',
      callback,
    );

    this.listeners.push(subscription);
    return () => subscription.remove();
  }

  removeAllListeners(): void {
    this.listeners.forEach(sub => sub.remove());
    this.listeners = [];
  }
}

const notificationService = new NotificationServiceClass();
export default notificationService;
