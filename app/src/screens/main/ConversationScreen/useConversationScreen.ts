import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Keyboard, FlatList } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { AppNotification } from '../../../services/notificationService';
import notificationService from '../../../services/notificationService';
import { useNotificationStore } from '../../../store/notificationStore';
import { useSMSStore } from '../../../store/smsStore';
import { SMS } from '../../../types';
import { extractPhoneNumber } from './helper';

// Normalize phone number for comparison
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  let normalized = phone.replace(/\D/g, '');
  normalized = normalized.replace(/^0+/, '');
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

interface UseConversationScreenParams {
  title: string;
  appName: string;
  type: string;
  phoneNumber?: string;
}

export const useConversationScreen = (
  params: UseConversationScreenParams,
  navigation: any,
) => {
  const { title, appName, type, phoneNumber } = params;

  const {
    notifications: allNotifications,
    removeNotification,
    addNotification,
    loadNotificationsForConversation,
  } = useNotificationStore();
  const {
    messages: smsMessages,
    isLoading: isSmsLoading,
    loadMessagesForSender,
  } = useSMSStore();
  const { isRTL, isDarkMode, colors, t } = useTheme();

  // State for loaded sender messages from Firebase
  const [loadedSenderMessages, setLoadedSenderMessages] = useState<SMS[]>([]);
  const [loadedNotifications, setLoadedNotifications] = useState<
    AppNotification[]
  >([]);
  const [isLoadingSenderMessages, setIsLoadingSenderMessages] = useState(false);

  // Dynamic colors from theme
  const bgColor = colors.background;
  const textColor = colors.text;
  const secondaryTextColor = colors.textSecondary;
  const bubbleColor = colors.card;
  const headerBgColor = colors.card;
  const borderColor = colors.border;

  const [smsText, setSmsText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Load messages/notifications for this conversation from Firebase on mount
  useEffect(() => {
    const loadConversationData = async () => {
      setIsLoadingSenderMessages(true);
      try {
        if (type === 'sms' && phoneNumber) {
          // Load SMS messages for this sender
          const messages = await loadMessagesForSender(phoneNumber);
          setLoadedSenderMessages(messages);
        } else {
          // Load notifications for this app/title combination
          const notifications = await loadNotificationsForConversation(
            title,
            appName,
            type,
          );
          setLoadedNotifications(notifications);
        }
      } catch (error) {
        console.log('Error loading conversation data:', error);
      } finally {
        setIsLoadingSenderMessages(false);
      }
    };
    loadConversationData();
  }, [
    type,
    phoneNumber,
    title,
    appName,
    loadMessagesForSender,
    loadNotificationsForConversation,
  ]);

  // Filter messages locally from smsMessages and merge with loaded messages
  const senderMessages = useMemo(() => {
    if (type === 'sms' && phoneNumber) {
      if (
        isSmsLoading &&
        smsMessages.length === 0 &&
        loadedSenderMessages.length === 0
      ) {
        return [];
      }

      const realtimeFiltered = smsMessages.filter(sms => {
        const smsPhoneNumber =
          (sms as any).phoneNumber ||
          (sms as any).sender ||
          (sms as any).address ||
          '';

        // المطابقة برقم الهاتف فقط
        return phoneNumbersMatch(smsPhoneNumber, phoneNumber);
      });

      // Merge with loaded messages (from Firebase)
      const allMessages = [...loadedSenderMessages, ...realtimeFiltered];

      // Remove duplicates by id or timestamp
      const uniqueMessages = allMessages.filter(
        (msg, index, self) =>
          index ===
          self.findIndex(
            m =>
              m.id === msg.id ||
              (m.timestamp === msg.timestamp &&
                (m as any).body === (msg as any).body),
          ),
      );

      return uniqueMessages;
    }
    return [];
  }, [type, phoneNumber, smsMessages, isSmsLoading, loadedSenderMessages]);

  // Convert SMS messages to AppNotification and merge
  const conversationNotifications = useMemo(() => {
    const validNotifications = Array.isArray(allNotifications)
      ? allNotifications
      : [];
    const validLoadedNotifications = Array.isArray(loadedNotifications)
      ? loadedNotifications
      : [];
    const validSmsMessages = Array.isArray(smsMessages) ? smsMessages : [];
    const validSenderMessages = Array.isArray(senderMessages)
      ? senderMessages
      : [];

    // Merge local notifications with loaded notifications from Firebase
    const allLocalNotifications = [
      ...validNotifications,
      ...validLoadedNotifications,
    ];
    const regularNotifications = allLocalNotifications.filter(
      n => n.title === title && n.appName === appName && n.type === type,
    );

    // Remove duplicates from regular notifications
    const uniqueRegularNotifications = regularNotifications.filter(
      (n, index, self) => index === self.findIndex(m => m.id === n.id),
    );

    if (type === 'sms') {
      const messagesToUse =
        validSenderMessages.length > 0
          ? validSenderMessages
          : validSmsMessages.filter(sms => {
              const smsSender =
                (sms as any).sender ||
                (sms as any).phoneNumber ||
                (sms as any).address ||
                'Unknown';
              const smsContactName = (sms as any).contactName || '';
              const filterKey = phoneNumber || title;

              // Match by phone number OR contact name
              const matchesBySender = phoneNumbersMatch(smsSender, filterKey);
              const matchesByContactName =
                smsContactName.toLowerCase() === filterKey.toLowerCase();

              return matchesBySender || matchesByContactName;
            });

      const smsNotifications: AppNotification[] = messagesToUse.map(sms => ({
        id: sms.id || `sms_${sms.timestamp}`,
        key: `sms_${sms.id || sms.timestamp}`,
        packageName: 'com.android.mms',
        title:
          (sms as any).contactName ||
          (sms as any).sender ||
          (sms as any).phoneNumber ||
          (sms as any).address ||
          'Unknown',
        text: (sms as any).body || (sms as any).message || '',
        appName: 'SMS',
        type: 'sms' as const,
        timestamp: sms.timestamp || Date.now(),
        read: (sms as any).read || false,
        smsType: (sms as any).type || 'inbox',
      }));

      const allMessages = [...uniqueRegularNotifications, ...smsNotifications];
      const uniqueMessages = allMessages.filter(
        (msg, index, self) => index === self.findIndex(m => m.id === msg.id),
      );

      console.log(
        '[useConversationScreen] conversationNotifications:',
        'smsNotifications=' + smsNotifications.length,
        'uniqueMessages=' + uniqueMessages.length,
      );

      return uniqueMessages.sort((a, b) => b.timestamp - a.timestamp);
    }

    return uniqueRegularNotifications.sort((a, b) => b.timestamp - a.timestamp);
  }, [
    allNotifications,
    loadedNotifications,
    smsMessages,
    senderMessages,
    title,
    appName,
    type,
    phoneNumber,
  ]);

  // Handle keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      removeNotification(id);
      if (conversationNotifications.length <= 1) {
        navigation.goBack();
      }
    },
    [removeNotification, conversationNotifications.length, navigation],
  );

  // State for error messages
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendSMS = useCallback(async () => {
    setErrorMessage('');

    if (!smsText.trim()) {
      setErrorMessage(t('pleaseEnterMessage'));
      return;
    }

    const phone = extractPhoneNumber(title);
    if (!phone || phone.length < 7) {
      setErrorMessage(t('couldNotDeterminePhone'));
      return;
    }

    setIsSending(true);

    try {
      const success = await notificationService.sendSMS(phone, smsText.trim());

      if (success) {
        const sentMessage: AppNotification = {
          id: `sent_${Date.now()}`,
          key: `sent_${Date.now()}`,
          title: title,
          text: smsText.trim(),
          appName: appName,
          packageName: 'com.IRopit.sent',
          type: 'sms',
          timestamp: Date.now(),
          read: true,
        };
        addNotification(sentMessage);

        setSmsText('');
        Keyboard.dismiss();

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        setErrorMessage(t('failedToSendSMS'));
      }
    } catch (error: any) {
      setErrorMessage(error.message || t('errorOccurred'));
    }

    setIsSending(false);
  }, [smsText, title, appName, addNotification, t]);

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const isSMSType = type === 'sms';

  return {
    // Data
    conversationNotifications,
    smsMessages,
    isSmsLoading,
    isLoadingSenderMessages,
    isSMSType,

    // State
    smsText,
    isSending,
    keyboardHeight,
    errorMessage,
    setErrorMessage,

    // Theme
    isRTL,
    isDarkMode,
    bgColor,
    textColor,
    secondaryTextColor,
    bubbleColor,
    headerBgColor,
    borderColor,

    // Refs
    flatListRef,

    // Actions
    setSmsText,
    handleDelete,
    handleSendSMS,
    goBack,
    scrollToEnd,
  };
};
