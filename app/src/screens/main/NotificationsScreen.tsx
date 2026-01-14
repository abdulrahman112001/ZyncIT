import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Animated,
  StatusBar,
  TextInput,
  Dimensions,
  I18nManager,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import notificationService, {
  AppNotification,
} from '../../services/notificationService';
import { useNotificationStore } from '../../store/notificationStore';
import { useSMSStore } from '../../store/smsStore';
import { useAuthStore } from '../../store/authStore';
import { useDeviceStore } from '../../store/deviceStore';
import firestore from '@react-native-firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 60;
const ACTION_WIDTH = 75;

interface GroupedNotification {
  key: string;
  title: string;
  appName: string;
  type: string;
  lastText: string;
  lastTimestamp: number;
  count: number;
  unreadCount: number;
  notifications: AppNotification[];
  phoneNumber?: string; // رقم الهاتف الأصلي الكامل للـ SMS
  packageName?: string; // Package name for app icon
  appIcon?: string; // Base64 app icon from device
}

// Import app icons utility
import { getAppIconInfo } from '../../utils/appIcons';

// Get app icon based on package name or type
const getAppIconName = (type: string, packageName?: string): string => {
  const iconInfo = getAppIconInfo(packageName, type);
  return iconInfo.iconName;
};

const getAppIconColor = (type: string, packageName?: string): string => {
  const iconInfo = getAppIconInfo(packageName, type);
  return iconInfo.color;
};

const SwipeableItem = ({
  item,
  onPress,
  onDelete,
  onMute,
  isRTL,
  colors,
  isDarkMode,
  isSelectMode,
  isSelected,
  onToggleSelect,
}: {
  item: GroupedNotification;
  onPress: () => void;
  onDelete: () => void;
  onMute: () => void;
  isRTL: boolean;
  colors: any;
  isDarkMode: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const handleSwipe = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -ACTION_WIDTH * 2 : ACTION_WIDTH * 2;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setSwiped(true);
  };

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setSwiped(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    const diff = now.getTime() - date.getTime();
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Dynamic styles based on theme
  const bgColor = isDarkMode ? '#000000' : colors.background;
  const surfaceColor = isDarkMode ? '#1C1C1E' : colors.surface;
  const avatarBgColor = isDarkMode ? '#3A3A3C' : '#E5E7EB';
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;
  const secondaryTextColor = isDarkMode ? '#8E8E93' : colors.textSecondary;
  const separatorColor = isDarkMode ? '#38383A' : colors.border;

  return (
    <View style={[styles.swipeContainer, { backgroundColor: bgColor }]}>
      {/* Actions Background - Right side for LTR, Left side for RTL */}
      {!isSelectMode && (
        <View
          style={[
            styles.actionsContainer,
            isRTL ? styles.actionsLeft : styles.actionsRight,
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.muteButton]}
            onPress={() => {
              onMute();
              resetSwipe();
            }}
          >
            <Ionicons name="notifications-off" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              onDelete();
            }}
          >
            <Ionicons name="trash" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[
          styles.messageRow,
          {
            backgroundColor: bgColor,
            transform: [{ translateX: isSelectMode ? 0 : translateX }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (isSelectMode && onToggleSelect) {
              onToggleSelect();
            } else if (swiped) {
              resetSwipe();
            } else {
              onPress();
            }
          }}
          onLongPress={() => {
            if (!isSelectMode) {
              handleSwipe(isRTL ? 'right' : 'left');
            }
          }}
          delayLongPress={300}
          style={styles.rowContent}
          activeOpacity={0.7}
        >
          {/* Checkbox for select mode */}
          {isSelectMode && (
            <View style={styles.checkboxContainer}>
              <View
                style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </View>
          )}

          {/* Avatar with Badge */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: avatarBgColor }]}>
              <Text style={[styles.avatarText, { color: textColor }]}>
                {getInitials(item.title)}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.messageContent}>
            <View style={styles.topRow}>
              <View style={styles.titleRow}>
                <Ionicons
                  name={getAppIconName(item.type, item.packageName)}
                  size={16}
                  color={getAppIconColor(item.type, item.packageName)}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.senderName, { color: textColor }]}
                  numberOfLines={1}
                >
                  {item.title || 'Unknown'}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: secondaryTextColor }]}>
                  {formatTime(item.lastTimestamp)}
                </Text>
                <Text style={[styles.chevron, { color: secondaryTextColor }]}>
                  ›
                </Text>
              </View>
            </View>
            <Text
              style={[styles.previewText, { color: secondaryTextColor }]}
              numberOfLines={2}
            >
              {item.lastText}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
      <View
        style={[
          styles.separator,
          isRTL ? styles.separatorRTL : styles.separatorLTR,
          { backgroundColor: separatorColor },
        ]}
      />
    </View>
  );
};

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const {
    notifications,
    addNotification,
    removeNotification,
    removeNotificationsByKeys,
    markGroupAsRead,
  } = useNotificationStore();
  const {
    messages: smsMessages,
    markMessagesAsReadBySender,
    loadMessages: loadSmsMessages,
    deleteMessagesBySender,
  } = useSMSStore();
  const { user } = useAuthStore();
  const { currentDevice } = useDeviceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { isRTL, t, colors, isDarkMode } = useTheme();

  // Debug log
  console.log(
    '📱 NotificationsScreen - isRTL from theme:',
    isRTL,
    '| I18nManager.isRTL:',
    I18nManager.isRTL,
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    [],
  );

  // Dynamic colors based on theme
  const bgColor = isDarkMode ? '#000000' : colors.background;
  const surfaceColor = isDarkMode ? '#1C1C1E' : colors.surface;
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;
  const secondaryTextColor = isDarkMode ? '#8E8E93' : colors.textSecondary;
  const separatorColor = isDarkMode ? '#38383A' : colors.border;

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: GroupedNotification } = {};

    // التأكد من أن البيانات arrays قبل المعالجة
    const validSmsMessages = Array.isArray(smsMessages) ? smsMessages : [];
    const validNotifications = Array.isArray(notifications)
      ? notifications
      : [];

    console.log('[NotificationsScreen] Grouping notifications:', {
      smsCount: validSmsMessages.length,
      notificationsCount: validNotifications.length,
      smsMessages: validSmsMessages.slice(0, 2),
    });

    // بناء جدول ربط بين الأسماء والأرقام من الرسائل التي لديها كلاهما
    const nameToPhoneMap: { [name: string]: string } = {};
    const phoneToNameMap: { [phone: string]: string } = {};

    validSmsMessages.forEach(sms => {
      const rawPhone = (sms as any).phoneNumber || (sms as any).sender || '';
      const name = (sms as any).contactName || '';
      const isPhone = /^[\+\d\s\-\(\)]+$/.test(rawPhone.trim());

      if (isPhone && name && rawPhone) {
        // تطبيع الرقم
        let normalized = rawPhone.replace(/[\s\-\(\)\+]/g, '').trim();
        if (normalized.startsWith('20') && normalized.length > 10) {
          normalized = normalized.substring(2);
        }
        if (normalized.startsWith('0') && normalized.length > 10) {
          normalized = normalized.substring(1);
        }

        nameToPhoneMap[name] = normalized;
        phoneToNameMap[normalized] = name;
      }
    });

    console.log('[NotificationsScreen] Name-Phone mapping:', nameToPhoneMap);

    // أولاً: تجميع رسائل SMS حسب رقم المرسل
    validSmsMessages.forEach((sms, index) => {
      // استخراج رقم الهاتف واسم جهة الاتصال
      let phoneNumber =
        (sms as any).phoneNumber ||
        (sms as any).sender ||
        (sms as any).address ||
        '';
      let contactName = (sms as any).contactName || '';

      // التحقق مما إذا كان phoneNumber يحتوي على رقم فعلي أم اسم
      // الرقم الحقيقي يبدأ بـ + أو أرقام فقط
      const isActualPhoneNumber = /^[\+\d\s\-\(\)]+$/.test(phoneNumber.trim());

      // تخطي الرسائل التي ليس لديها رقم هاتف حقيقي
      if (!isActualPhoneNumber) {
        console.log(
          '[SMS Skip] No valid phone number:',
          phoneNumber || contactName,
        );
        return; // تخطي هذه الرسالة
      }

      // Debug: طباعة أول 10 رسائل
      if (index < 10) {
        console.log('[SMS Debug]', {
          index,
          phoneNumber,
          contactName,
          isActualPhoneNumber,
          sender: (sms as any).sender,
        });
      }

      // تطبيع رقم الهاتف: إزالة المسافات والرموز غير الضرورية وكود الدولة
      let normalizedPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, '').trim();
      // إزالة كود الدولة المصري إذا وجد (20)
      if (normalizedPhone.startsWith('20') && normalizedPhone.length > 10) {
        normalizedPhone = normalizedPhone.substring(2);
      }
      // إزالة الصفر البادئ إذا وجد
      if (normalizedPhone.startsWith('0') && normalizedPhone.length > 10) {
        normalizedPhone = normalizedPhone.substring(1);
      }

      // استخدام جدول الربط: إذا كان لدينا اسم بدون رقم، ابحث عن الرقم المرتبط به
      let groupingKey = '';
      if (normalizedPhone) {
        groupingKey = normalizedPhone;
      } else if (contactName && nameToPhoneMap[contactName]) {
        // لدينا اسم ولدينا رقم مرتبط به في الجدول
        groupingKey = nameToPhoneMap[contactName];
      } else {
        groupingKey = contactName || 'Unknown';
      }

      // عرض اسم جهة الاتصال إذا وجد، وإلا الرقم
      const displayName =
        contactName ||
        phoneToNameMap[normalizedPhone] ||
        phoneNumber ||
        'Unknown';
      const groupKey = `sms_${groupingKey}`;
      const smsId = sms.id || `sms_${sms.timestamp}`;

      const notificationItem: AppNotification = {
        id: smsId,
        key: `sms_${smsId}`,
        packageName: 'com.android.mms',
        title: displayName,
        text:
          (sms as any).body || (sms as any).message || (sms as any).text || '',
        appName: 'SMS',
        type: 'sms',
        smsType: (sms as any).type || 'inbox', // inbox أو sent
        timestamp: sms.timestamp || Date.now(),
        read: (sms as any).read || false,
        phoneNumber: phoneNumber, // الرقم الكامل الأصلي من Firebase
      };

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          title: displayName,
          appName: 'SMS',
          type: 'sms',
          lastText: notificationItem.text,
          lastTimestamp: notificationItem.timestamp,
          count: 1,
          unreadCount: notificationItem.read ? 0 : 1,
          notifications: [notificationItem],
          phoneNumber: phoneNumber, // حفظ رقم الهاتف الأصلي الكامل
        };
      } else {
        groups[groupKey].count++;
        if (!notificationItem.read) groups[groupKey].unreadCount++;
        groups[groupKey].notifications.push(notificationItem);
        if (notificationItem.timestamp > groups[groupKey].lastTimestamp) {
          groups[groupKey].lastTimestamp = notificationItem.timestamp;
          groups[groupKey].lastText = notificationItem.text;
        }
      }
    });

    console.log('[NotificationsScreen] After SMS grouping:', {
      groupsCount: Object.keys(groups).length,
      smsGroups: Object.keys(groups).filter(k => k.startsWith('sms_')).length,
      smsGroupKeys: Object.keys(groups).filter(k => k.startsWith('sms_')),
    });

    // ثانياً: تجميع الإشعارات العادية (Filter out calls)
    validNotifications
      .filter(n => n.type !== 'call' && n.type !== 'missed_call')
      .forEach(n => {
        const groupKey = `${n.title}_${n.appName}_${n.type}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            key: groupKey,
            title: n.title,
            appName: n.appName,
            type: n.type,
            lastText: n.text,
            lastTimestamp: n.timestamp,
            count: 1,
            unreadCount: n.read ? 0 : 1,
            notifications: [n],
            packageName: n.packageName,
            appIcon: (n as any).appIcon,
          };
        } else {
          groups[groupKey].count++;
          if (!n.read) groups[groupKey].unreadCount++;
          groups[groupKey].notifications.push(n);
          if (n.timestamp > groups[groupKey].lastTimestamp) {
            groups[groupKey].lastTimestamp = n.timestamp;
            groups[groupKey].lastText = n.text;
          }
          // Update packageName if not set
          if (!groups[groupKey].packageName && n.packageName) {
            groups[groupKey].packageName = n.packageName;
          }
        }
      });

    let result = Object.values(groups).sort(
      (a, b) => b.lastTimestamp - a.lastTimestamp,
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        g =>
          (g.title || '').toLowerCase().includes(query) ||
          (g.lastText || '').toLowerCase().includes(query),
      );
    }

    console.log('[NotificationsScreen] Final grouped result:', {
      totalGroups: result.length,
      smsGroups: result.filter(g => g.type === 'sms').length,
      groups: result.map(g => ({
        type: g.type,
        title: g.title,
        count: g.count,
      })),
    });

    return result;
  }, [notifications, smsMessages, searchQuery]);

  const checkPermission = useCallback(async () => {
    try {
      const granted = await notificationService.isPermissionGranted();
      console.log('[NotificationsScreen] Permission check:', granted);
      setHasPermission(granted);
      return granted;
    } catch (error) {
      console.error('[NotificationsScreen] Permission check error:', error);
      return false;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    Alert.alert(
      'Enable Notification Access',
      'ZyncIT needs notification access to sync your messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => notificationService.openSettings(),
        },
      ],
    );
  }, []);

  const saveToFirebase = useCallback(
    async (notification: AppNotification) => {
      if (!user) return;
      const uniqueId = `${notification.key}_${notification.timestamp}`;
      try {
        await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('notifications')
          .doc(uniqueId)
          .set({
            ...notification,
            id: uniqueId,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      } catch (error: any) {
        // Silently handle Firebase errors - notifications will still work locally
        if (error?.code) {
          console.warn('[Firebase] Error saving notification:', error.code);
        } else {
          console.warn(
            '[Firebase] Error saving notification:',
            error?.message || 'Unknown error',
          );
        }
      }
    },
    [user],
  );

  useEffect(() => {
    checkPermission();
    const interval = setInterval(checkPermission, 3000);
    return () => clearInterval(interval);
  }, [checkPermission]);

  // تحميل SMS من Firebase عند بدء الشاشة (بعد تحميل المستخدم والجهاز)
  useEffect(() => {
    if (user && currentDevice) {
      console.log(
        '[NotificationsScreen] Loading SMS from Firebase... user:',
        user.uid,
        'device:',
        currentDevice.id,
      );
      loadSmsMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentDevice]);

  // تحميل الإشعارات العادية من Firebase
  useEffect(() => {
    if (!user || !currentDevice) return;

    console.log(
      '[NotificationsScreen] Setting up Firebase listener for regular notifications',
    );

    const unsubscribe = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('devices')
      .doc(currentDevice.id)
      .collection('notifications')
      .where('type', '!=', 'sms') // جلب كل الإشعارات ماعدا SMS
      .limit(100)
      .onSnapshot(
        snapshot => {
          console.log(
            '[NotificationsScreen] Firebase notifications updated:',
            snapshot.size,
          );
          snapshot.forEach(doc => {
            const data = doc.data();
            const notification: AppNotification & { appIcon?: string } = {
              id: doc.id,
              key: data.key || `${data.packageName}_${data.timestamp}`,
              packageName: data.packageName || '',
              title: data.title || '',
              text: data.text || '',
              type: data.type || 'other',
              timestamp: data.timestamp || Date.now(),
              appName: data.appName || '',
              read: data.read ?? false,
              appIcon: data.appIcon, // أيقونة التطبيق من الجهاز
            };
            addNotification(notification);
          });
        },
        error => {
          console.error(
            '[NotificationsScreen] Error loading notifications:',
            error,
          );
        },
      );

    return () => unsubscribe();
  }, [user, currentDevice, addNotification]);

  useEffect(() => {
    if (!hasPermission) {
      console.log('[NotificationsScreen] No permission, skipping listener');
      return;
    }

    console.log('[NotificationsScreen] Setting up notification listener');
    const unsubscribe = notificationService.onNotificationReceived(
      notification => {
        // تخطي إشعارات SMS بالكامل - يتم معالجتها من SMS listener
        if (
          notification.type === 'sms' ||
          notification.packageName?.includes('messaging') ||
          notification.packageName?.includes('mms')
        ) {
          console.log(
            '[NotificationsScreen] Skipping SMS notification:',
            notification.title,
          );
          return;
        }

        console.log(
          '[NotificationsScreen] Received notification:',
          notification.title,
        );
        addNotification(notification);
        saveToFirebase(notification);
      },
    );
    return () => {
      console.log('[NotificationsScreen] Cleaning up listener');
      unsubscribe();
    };
  }, [hasPermission, addNotification, saveToFirebase]);

  const handlePress = (group: GroupedNotification) => {
    // تعليم الإشعارات العادية كمقروءة
    markGroupAsRead(group.title, group.appName, group.type);

    // إذا كان النوع SMS، علّم رسائل SMS كمقروءة أيضاً
    // استخدام phoneNumber الكامل من group
    if (group.type === 'sms' && group.phoneNumber) {
      markMessagesAsReadBySender(group.phoneNumber);
    }

    navigation.navigate('Conversation', {
      title: group.title,
      appName: group.appName,
      type: group.type,
      phoneNumber: group.phoneNumber || group.key.replace('sms_', ''), // استخدام الرقم الأصلي
      notifications: group.notifications,
    });
  };

  const handleDelete = (group: GroupedNotification) => {
    Alert.alert(
      isRTL ? 'حذف المحادثة' : 'Delete Conversation',
      isRTL
        ? `حذف جميع الرسائل من ${group.title}؟`
        : `Delete all messages from ${group.title}?`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Delete notifications
            group.notifications.forEach(n => removeNotification(n.id));

            // If SMS type, also delete from SMS store
            if (group.type === 'sms') {
              const phoneNumber = group.key.replace('sms_', '');
              await deleteMessagesBySender(phoneNumber);
            }
          },
        },
      ],
    );
  };

  const handleMute = (group: GroupedNotification) => {
    Alert.alert('Muted', `Notifications from ${group.title} are now muted.`);
  };

  const toggleSelectNotification = (key: string) => {
    setSelectedNotifications(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key],
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === groupedNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(groupedNotifications.map(g => g.key));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedNotifications.length === 0) return;

    Alert.alert(
      isRTL ? 'حذف الإشعارات المحددة' : 'Delete Selected Notifications',
      isRTL
        ? `هل أنت متأكد من حذف ${selectedNotifications.length} محادثة؟`
        : `Are you sure you want to delete ${selectedNotifications.length} conversations?`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Delete each selected group's notifications
            for (const key of selectedNotifications) {
              const group = groupedNotifications.find(g => g.key === key);
              if (group) {
                // Delete from notifications store
                group.notifications.forEach(n => removeNotification(n.id));

                // If SMS type, also delete from SMS store
                if (group.type === 'sms') {
                  const phoneNumber = key.replace('sms_', '');
                  await deleteMessagesBySender(phoneNumber);
                }
              }
            }
            setSelectedNotifications([]);
            setIsSelectMode(false);
            Alert.alert(
              isRTL ? 'تم' : 'Done',
              isRTL
                ? 'تم حذف الإشعارات المحددة'
                : 'Selected notifications deleted',
            );
          },
        },
      ],
    );
  };

  const cancelSelectMode = () => {
    setIsSelectMode(false);
    setSelectedNotifications([]);
  };

  const renderItem = ({ item }: { item: GroupedNotification }) => (
    <SwipeableItem
      item={item}
      onPress={() => handlePress(item)}
      onDelete={() => handleDelete(item)}
      onMute={() => handleMute(item)}
      isRTL={isRTL}
      colors={colors}
      isDarkMode={isDarkMode}
      isSelectMode={isSelectMode}
      isSelected={selectedNotifications.includes(item.key)}
      onToggleSelect={() => toggleSelectNotification(item.key)}
    />
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: bgColor }]}>
      {isSelectMode ? (
        <>
          <TouchableOpacity onPress={cancelSelectMode}>
            <Text style={[styles.headerButtonText, { color: '#0A84FF' }]}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSelectAll}>
            <Text style={[styles.headerButtonText, { color: '#0A84FF' }]}>
              {selectedNotifications.length === groupedNotifications.length
                ? isRTL
                  ? 'إلغاء تحديد الكل'
                  : 'Deselect All'
                : isRTL
                ? 'تحديد الكل'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.headerSpacer} />
          <TouchableOpacity onPress={() => setIsSelectMode(true)}>
            <Text style={[styles.headerButtonText, { color: '#0A84FF' }]}>
              {isRTL ? 'تحديد' : 'Select'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={[styles.title, { color: textColor }]}>
        {isRTL ? 'الإشعارات' : 'Notifications'}
      </Text>
      {isSelectMode && (
        <TouchableOpacity
          onPress={handleDeleteSelected}
          style={[
            styles.deleteSelectedButton,
            selectedNotifications.length === 0 && { opacity: 0.5 },
          ]}
          disabled={selectedNotifications.length === 0}
        >
          <Ionicons name="trash-outline" size={22} color="#FF3B30" />
          {selectedNotifications.length > 0 && (
            <Text style={styles.deleteSelectedText}>
              ({selectedNotifications.length})
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA',
            borderWidth: 1,
            borderColor: isDarkMode ? '#3A3A3C' : '#D1D1D6',
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={isDarkMode ? '#EBEBF5' : '#3C3C43'}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: isDarkMode ? '#FFFFFF' : '#000000' },
            isRTL && { textAlign: 'right' },
          ]}
          placeholder={isRTL ? 'بحث...' : 'Search...'}
          placeholderTextColor={isDarkMode ? '#EBEBF599' : '#3C3C4399'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons
              name="close-circle"
              size={20}
              color={isDarkMode ? '#EBEBF5' : '#3C3C43'}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {!hasPermission ? (
        <>
          <Text style={styles.emptyIcon}>ًں”’</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            {isRTL ? 'تفعيل الوصول للإشعارات' : 'Enable Notification Access'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            {isRTL
              ? 'ZyncIT يحتاج إذن لقراءة الإشعارات لمزامنة الرسائل'
              : 'ZyncIT needs permission to read notifications for syncing messages.'}
          </Text>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={requestPermission}
          >
            <Text style={styles.enableButtonText}>
              {isRTL ? 'تفعيل الوصول' : 'Enable Access'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            {isRTL ? 'لا توجد رسائل' : 'No Messages Yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
            {isRTL
              ? 'ستظهر رسائلك هنا عند استلام إشعارات'
              : 'Your messages will appear here when you receive notifications.'}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />
      {renderHeader()}
      {renderTitle()}
      {renderSearchBar()}
      <FlatList
        data={groupedNotifications}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={checkPermission}
            tintColor="#0A84FF"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 18,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSpacer: {
    width: 36,
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  deleteSelectedText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 36,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 16,
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  swipeContainer: {
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  actionsLeft: {
    left: 0,
  },
  actionsRight: {
    right: 0,
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    backgroundColor: '#5856D6',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionIcon: {
    fontSize: 24,
  },
  messageRow: {},
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowContentRTL: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '500',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#000000',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  messageContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topRowRTL: {
    flexDirection: 'row-reverse',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleRowRTL: {
    flexDirection: 'row-reverse',
  },
  senderName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 15,
  },
  chevron: {
    fontSize: 18,
    marginLeft: 4,
    fontWeight: '300',
  },
  previewText: {
    fontSize: 15,
    lineHeight: 20,
  },
  separator: {
    height: 0.5,
  },
  separatorLTR: {
    marginLeft: 84,
  },
  separatorRTL: {
    marginRight: 84,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  enableButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default NotificationsScreen;
