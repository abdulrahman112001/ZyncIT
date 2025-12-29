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
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import notificationService, {
  AppNotification,
} from '../../services/notificationService';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
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
}

const SwipeableItem = ({
  item,
  onPress,
  onDelete,
  onMute,
  isRTL,
  colors,
  isDarkMode,
}: {
  item: GroupedNotification;
  onPress: () => void;
  onDelete: () => void;
  onMute: () => void;
  isRTL: boolean;
  colors: any;
  isDarkMode: boolean;
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
          <Text style={styles.actionIcon}>ًں”•</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            onDelete();
          }}
        >
          <Text style={styles.actionIcon}>ًں—‘ï¸ڈ</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.messageRow,
          { backgroundColor: bgColor, transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (swiped) {
              resetSwipe();
            } else {
              onPress();
            }
          }}
          onLongPress={() => {
            handleSwipe(isRTL ? 'right' : 'left');
          }}
          delayLongPress={300}
          style={styles.rowContent}
          activeOpacity={0.7}
        >
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
              <Text
                style={[styles.senderName, { color: textColor }]}
                numberOfLines={1}
              >
                {item.title || 'Unknown'}
              </Text>
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
      <View style={[styles.separator, { backgroundColor: separatorColor }]} />
    </View>
  );
};

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const {
    notifications,
    addNotification,
    removeNotification,
    markGroupAsRead,
  } = useNotificationStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const { isRTL, t, colors, isDarkMode } = useTheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic colors based on theme
  const bgColor = isDarkMode ? '#000000' : colors.background;
  const surfaceColor = isDarkMode ? '#1C1C1E' : colors.surface;
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;
  const secondaryTextColor = isDarkMode ? '#8E8E93' : colors.textSecondary;
  const separatorColor = isDarkMode ? '#38383A' : colors.border;

  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: GroupedNotification } = {};

    // Filter out calls - they should only appear in Calls screen
    notifications
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
          };
        } else {
          groups[groupKey].count++;
          if (!n.read) groups[groupKey].unreadCount++;
          groups[groupKey].notifications.push(n);
          if (n.timestamp > groups[groupKey].lastTimestamp) {
            groups[groupKey].lastTimestamp = n.timestamp;
            groups[groupKey].lastText = n.text;
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
          g.title.toLowerCase().includes(query) ||
          g.lastText.toLowerCase().includes(query),
      );
    }

    return result;
  }, [notifications, searchQuery]);

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

  useEffect(() => {
    if (!hasPermission) {
      console.log('[NotificationsScreen] No permission, skipping listener');
      return;
    }

    console.log('[NotificationsScreen] Setting up notification listener');
    const unsubscribe = notificationService.onNotificationReceived(
      notification => {
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
    markGroupAsRead(group.title, group.appName, group.type);
    navigation.navigate('Conversation', {
      title: group.title,
      appName: group.appName,
      type: group.type,
      notifications: group.notifications,
    });
  };

  const handleDelete = (group: GroupedNotification) => {
    Alert.alert(
      'Delete Conversation',
      `Delete all messages from ${group.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            group.notifications.forEach(n => removeNotification(n.id));
          },
        },
      ],
    );
  };

  const handleMute = (group: GroupedNotification) => {
    Alert.alert('Muted', `Notifications from ${group.title} are now muted.`);
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
    />
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: bgColor }]} />
  );

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={[styles.title, { color: textColor }]}>
        {isRTL ? 'الإشعارات' : 'Notifications'}
      </Text>
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
    paddingHorizontal: 16,
    paddingBottom: 8,
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
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
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
  senderName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
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
    marginLeft: 84,
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
