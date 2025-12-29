import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
} from 'react-native';

const { SmsModule } = NativeModules;

interface SmsMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  read: boolean;
}

interface ReceivedSms {
  sender: string;
  message: string;
  timestamp: number;
}

class SmsService {
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'android' && SmsModule) {
      this.eventEmitter = new NativeEventEmitter(SmsModule);
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.SEND_SMS,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      ]);

      return (
        granted['android.permission.READ_SMS'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.RECEIVE_SMS'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.SEND_SMS'] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }

  async getAllSms(limit: number = 100): Promise<SmsMessage[]> {
    if (Platform.OS !== 'android' || !SmsModule) {
      console.log('SMS Module not available');
      return [];
    }

    try {
      const messages = await SmsModule.getAllSms(limit);
      return messages;
    } catch (error) {
      console.error('Error getting SMS:', error);
      return [];
    }
  }

  async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    if (Platform.OS !== 'android' || !SmsModule) {
      console.log('SMS Module not available');
      return false;
    }

    try {
      await SmsModule.sendSms(phoneNumber, message);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  onSmsReceived(callback: (sms: ReceivedSms) => void): () => void {
    if (!this.eventEmitter) {
      return () => {};
    }

    const subscription = this.eventEmitter.addListener(
      'onSmsReceived',
      callback,
    );
    return () => subscription.remove();
  }
}

const smsService = new SmsService();
export default smsService;
export type { SmsMessage, ReceivedSms };

