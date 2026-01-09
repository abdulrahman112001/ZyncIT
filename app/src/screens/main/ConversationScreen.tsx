import Icon from 'react-native-vector-icons/Ionicons';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  PermissionsAndroid,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AppNotification } from '../../services/notificationService';
import notificationService from '../../services/notificationService';
import { useNotificationStore } from '../../store/notificationStore';
import { useSMSStore } from '../../store/smsStore';

interface ConversationScreenProps {
  route: {
    params: {
      title: string;
      appName: string;
      type: string;
      phoneNumber?: string;
      notifications: AppNotification[];
    };
  };
  navigation: any;
}

const MessageBubble = ({
  item,
  onDelete,
  isRTL,
  textColor,
  secondaryTextColor,
  bubbleColor,
  bgColor,
}: {
  item: AppNotification;
  onDelete: (id: string) => void;
  isRTL: boolean;
  textColor: string;
  secondaryTextColor: string;
  bubbleColor: string;
  bgColor: string;
}) => {
  // Determine if message is sent (for SMS)
  const isSent = item.smsType === 'sent';
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeThreshold = 100;
  const maxSwipe = 100;

  // Store callbacks in refs to avoid stale closures
  const onDeleteRef = useRef(onDelete);
  const isRTLRef = useRef(isRTL);
  const itemIdRef = useRef(item.id);

  useEffect(() => {
    onDeleteRef.current = onDelete;
    isRTLRef.current = isRTL;
    itemIdRef.current = item.id;
  }, [onDelete, isRTL, item.id]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRTLRef.current) {
          if (gestureState.dx > 0)
            translateX.setValue(Math.min(gestureState.dx, maxSwipe));
        } else {
          if (gestureState.dx < 0)
            translateX.setValue(Math.max(gestureState.dx, -maxSwipe));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldDelete = isRTLRef.current
          ? gestureState.dx > swipeThreshold
          : gestureState.dx < -swipeThreshold;

        if (shouldDelete) {
          Animated.timing(translateX, {
            toValue: isRTLRef.current ? 400 : -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDeleteRef.current(itemIdRef.current));
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today ${timeStr}`;
    }

    return (
      date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }) +
      ' at ' +
      timeStr
    );
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const phoneRegex = /(\d{10,})/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <Text
            key={index}
            style={styles.linkText}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }

      const phoneParts = part.split(phoneRegex);
      return phoneParts.map((phonePart, phoneIndex) => {
        if (phoneRegex.test(phonePart)) {
          return (
            <Text
              key={`${index}-${phoneIndex}`}
              style={styles.linkText}
              onPress={() => Linking.openURL(`tel:${phonePart}`)}
            >
              {phonePart}
            </Text>
          );
        }
        return <Text key={`${index}-${phoneIndex}`}>{phonePart}</Text>;
      });
    });
  };

  return (
    <View style={styles.bubbleContainer}>
      <View
        style={[styles.deleteBackground, isRTL ? { left: 0 } : { right: 0 }]}
      >
        <Icon name="trash" size={24} color="#FFFFFF" />
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bubbleWrapper,
          { transform: [{ translateX }], backgroundColor: bgColor },
        ]}
      >
        <Text
          style={[
            styles.timeLabel,
            { color: secondaryTextColor },
            isSent && styles.timeRight,
          ]}
        >
          {formatTime(item.timestamp)}
        </Text>
        <View
          style={[
            styles.bubble,
            { backgroundColor: isSent ? '#0A84FF' : bubbleColor },
            isSent && styles.bubbleSent,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isSent ? '#FFFFFF' : textColor },
            ]}
          >
            {renderTextWithLinks(item.text)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const ConversationScreen = ({ route, navigation }: ConversationScreenProps) => {
  const { title, appName, type, phoneNumber } = route.params;
  const {
    notifications: allNotifications,
    removeNotification,
    addNotification,
  } = useNotificationStore();
  const { messages: smsMessages } = useSMSStore();
  const { isRTL, isDarkMode } = useTheme();

  // Dynamic colors based on theme
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const surfaceColor = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const bubbleColor = isDarkMode ? '#2C2C2E' : '#E8E8ED';
  const headerBgColor = isDarkMode ? '#1C1C1E' : '#F8F8F8';
  const inputBgColor = isDarkMode ? '#2C2C2E' : '#FFFFFF';
  const borderColor = isDarkMode ? '#3A3A3C' : '#E5E5EA';
  const [smsText, setSmsText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // تحويل رسائل SMS إلى AppNotification ودمجها
  const conversationNotifications = useMemo(() => {
    // التأكد من أن البيانات arrays قبل المعالجة
    const validNotifications = Array.isArray(allNotifications)
      ? allNotifications
      : [];
    const validSmsMessages = Array.isArray(smsMessages) ? smsMessages : [];

    // أولاً: الإشعارات العادية
    const regularNotifications = validNotifications.filter(
      n => n.title === title && n.appName === appName && n.type === type,
    );

    // ثانياً: إذا كان النوع sms، أضف رسائل SMS من smsStore
    if (type === 'sms') {
      const smsNotifications: AppNotification[] = validSmsMessages
        .filter(sms => {
          const sender =
            (sms as any).sender ||
            (sms as any).phoneNumber ||
            (sms as any).address ||
            'Unknown';
          // استخدام phoneNumber للتصفية إذا كان موجوداً، وإلا استخدم title
          const filterKey = phoneNumber || title;
          return sender === filterKey;
        })
        .map(sms => ({
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
          smsType: (sms as any).type || 'inbox', // 'sent' or 'inbox'
        }));

      // دمج وإزالة التكرار
      const allMessages = [...regularNotifications, ...smsNotifications];
      const uniqueMessages = allMessages.filter(
        (msg, index, self) => index === self.findIndex(m => m.id === msg.id),
      );
      return uniqueMessages.sort((a, b) => a.timestamp - b.timestamp);
    }

    return regularNotifications.sort((a, b) => a.timestamp - b.timestamp);
  }, [allNotifications, smsMessages, title, appName, type]);

  // Handle keyboard events for Android
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to end when keyboard opens
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

  const handleDelete = (id: string) => {
    removeNotification(id);
    if (conversationNotifications.length <= 1) {
      navigation.goBack();
    }
  };

  const extractPhoneNumber = (text: string): string => {
    let cleaned = text.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    if (cleaned.startsWith('0') && cleaned.length >= 10) {
      return cleaned;
    }
    return cleaned;
  };

  const handleSendSMS = async () => {
    if (!smsText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    const phoneNumber = extractPhoneNumber(title);
    if (!phoneNumber || phoneNumber.length < 7) {
      Alert.alert('Error', 'Could not determine phone number from: ' + title);
      return;
    }

    setIsSending(true);

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

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'SMS permission is required');
        setIsSending(false);
        return;
      }

      console.log('[SMS] Sending to:', phoneNumber, 'Message:', smsText.trim());

      const success = await notificationService.sendSMS(
        phoneNumber,
        smsText.trim(),
      );

      if (success) {
        // Add sent message to the notification store
        const sentMessage: AppNotification = {
          id: `sent_${Date.now()}`,
          key: `sent_${Date.now()}`,
          title: title,
          text: smsText.trim(),
          appName: appName,
          packageName: 'com.zyncit.sent',
          type: 'sms',
          timestamp: Date.now(),
          read: true,
        };
        addNotification(sentMessage);

        setSmsText('');
        Keyboard.dismiss();

        // Scroll to the new message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('[SMS] Error:', error);
      Alert.alert('Error', error.message || 'An error occurred');
    }

    setIsSending(false);
  };

  const isSMSType = type === 'sms';

  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: headerBgColor, borderBottomColor: borderColor },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text
            style={[
              styles.backIcon,
              { color: isDarkMode ? '#0A84FF' : '#007AFF' },
            ]}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View
            style={[
              styles.headerAvatar,
              { backgroundColor: isDarkMode ? '#3A3A3C' : '#C7C7CC' },
            ]}
          >
            <Text style={styles.headerAvatarText}>{getInitials(title)}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text
              style={[styles.headerName, { color: textColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={[styles.headerChevron, { color: secondaryTextColor }]}>
              ›
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: secondaryTextColor }]}>
            {isSMSType ? 'Text Message • SMS' : appName}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={conversationNotifications}
        renderItem={({ item }) => (
          <MessageBubble
            item={item}
            onDelete={handleDelete}
            isRTL={isRTL}
            textColor={textColor}
            secondaryTextColor={secondaryTextColor}
            bubbleColor={bubbleColor}
            bgColor={bgColor}
          />
        )}
        keyExtractor={item => item.id}
        style={{ flex: 1, backgroundColor: bgColor }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: isSMSType ? 20 : 20 },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          if (conversationNotifications.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* SMS Input removed - not needed for notification viewer */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#38383A',
  },
  backButton: {
    position: 'absolute',
    left: 8,
    top: 44,
    padding: 8,
    zIndex: 10,
  },
  backIcon: {
    color: '#0A84FF',
    fontSize: 40,
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  headerChevron: {
    color: '#8E8E93',
    fontSize: 18,
    marginLeft: 2,
  },
  headerSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
  },
  bubbleContainer: {
    marginBottom: 16,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  deleteIcon: {
    fontSize: 24,
  },
  bubbleWrapper: {
    // backgroundColor is set dynamically via bgColor prop
  },
  timeLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  bubble: {
    // backgroundColor is set dynamically via bubbleColor prop
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  bubbleSent: {
    alignSelf: 'flex-end',
  },
  timeRight: {
    textAlign: 'right',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  linkText: {
    color: '#0A84FF',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 34,
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: '#38383A',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#38383A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100,
    marginRight: 10,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    padding: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A3C',
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ConversationScreen;
