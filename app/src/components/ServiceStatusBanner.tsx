import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  NativeModules,
  AppState,
  AppStateStatus,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../store/settingsStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { NotificationModule } = NativeModules;

interface ServiceStatusBannerProps {
  onDismiss?: () => void;
}

const ServiceStatusBanner: React.FC<ServiceStatusBannerProps> = ({
  onDismiss,
}) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState<
    boolean | null
  >(null);
  const [dismissed, setDismissed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const checkCountRef = useRef(0);
  const { darkMode } = useSettingsStore();
  const insets = useSafeAreaInsets();

  const checkStatus = useCallback(async () => {
    try {
      if (NotificationModule) {
        const connected = await NotificationModule.isServiceConnected();
        const granted = await NotificationModule.isPermissionGranted();
        setIsConnected(connected);
        setIsPermissionGranted(granted);

        if (connected) {
          setDismissed(false);
        }
      }
    } catch (error) {
      console.error('Error checking service status:', error);
    }
  }, []);

  useEffect(() => {
    const initialChecks = async () => {
      for (let i = 0; i < 3; i++) {
        await checkStatus();
        checkCountRef.current = i + 1;

        if (NotificationModule) {
          const connected = await NotificationModule.isServiceConnected();
          if (connected) {
            setIsReady(true);
            return;
          }
        }

        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      setIsReady(true);
    };

    initialChecks();

    const subscription = AppState.addEventListener(
      'change',
      (state: AppStateStatus) => {
        if (state === 'active') {
          checkStatus();
        }
      },
    );

    const interval = setInterval(checkStatus, 10000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkStatus]);

  const handleOpenSettings = async () => {
    try {
      if (NotificationModule) {
        await NotificationModule.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (!isReady || isConnected === null || isConnected === true || dismissed) {
    return null;
  }

  let message = '';
  let subMessage = '';

  if (!isPermissionGranted) {
    message = 'إذن الإشعارات غير مُفعّل';
    subMessage = 'يرجى تفعيل إذن الإشعارات لاستقبال الرسائل والمكالمات';
  } else if (!isConnected) {
    message = 'خدمة الإشعارات غير متصلة';
    subMessage = 'يرجى إعادة تفعيل الإذن (أوقفه ثم فعّله مجدداً)';
  }

  return (
    <View style={[styles.container, { marginTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
        <Icon name="close" size={22} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="notifications-off-outline" size={28} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.subMessage}>{subMessage}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleOpenSettings}
        activeOpacity={0.8}
      >
        <Icon
          name="settings-outline"
          size={18}
          color="#E74C3C"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>فتح الإعدادات</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#E74C3C',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: 4,
    zIndex: 10,
  },
  content: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  subMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'right',
    lineHeight: 18,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#E74C3C',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default ServiceStatusBanner;
