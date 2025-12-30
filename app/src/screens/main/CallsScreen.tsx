import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  StatusBar,
  TextInput,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallStore } from '../../store/callStore';
import { useNativeEvents } from '../../hooks/useNativeEvents';
import { CallLog, RootStackParamList } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ACTION_WIDTH = 75;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GroupedCall {
  key: string;
  contactName: string;
  phoneNumber: string;
  lastType: CallLog['type'];
  lastTimestamp: number;
  lastDuration: number;
  count: number;
  calls: CallLog[];
}

const SwipeableCallItem = ({
  item,
  onPress,
  onDelete,
  isRTL,
  isDarkMode,
  textColor,
  secondaryTextColor,
  bgColor,
  avatarBgColor,
}: {
  item: GroupedCall;
  onPress: () => void;
  onDelete: () => void;
  isRTL: boolean;
  isDarkMode: boolean;
  textColor: string;
  secondaryTextColor: string;
  bgColor: string;
  avatarBgColor: string;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const handleSwipe = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -ACTION_WIDTH : ACTION_WIDTH;
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

  const getInitials = (name: string, phone: string) => {
    if (name && name !== phone) {
      const words = name.trim().split(' ');
      if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return '📞';
  };

  const getCallTypeIndicator = (type: CallLog['type']) => {
    switch (type) {
      case 'incoming':
        return { icon: '↙️', color: '#30D158' };
      case 'outgoing':
        return { icon: '↗️', color: '#0A84FF' };
      case 'missed':
        return { icon: '📵', color: '#FF3B30' };
      case 'rejected':
        return { icon: '❌', color: '#FF3B30' };
      default:
        return { icon: '📞', color: '#8E8E93' };
    }
  };

  const typeInfo = getCallTypeIndicator(item.lastType);
  const displayName = item.contactName || item.phoneNumber;
  const isMissed = item.lastType === 'missed' || item.lastType === 'rejected';

  return (
    <View style={[styles.swipeContainer, { backgroundColor: bgColor }]}>
      <View
        style={[
          styles.actionsContainer,
          isRTL ? styles.actionsLeft : styles.actionsRight,
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            onDelete();
          }}
        >
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.callRow,
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
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: avatarBgColor }]}>
              <Text style={[styles.avatarText, { color: textColor }]}>
                {getInitials(item.contactName || '', item.phoneNumber)}
              </Text>
            </View>
          </View>

          <View style={styles.callContent}>
            <View style={styles.topRow}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.callerName,
                    { color: textColor },
                    isMissed && styles.missedCallName,
                  ]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                {item.count > 1 && (
                  <Text
                    style={[styles.callCount, { color: secondaryTextColor }]}
                  >
                    ({item.count})
                  </Text>
                )}
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
            <View style={styles.subtitleRow}>
              <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
              <Text style={[styles.phoneText, { color: secondaryTextColor }]}>
                {item.phoneNumber}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
      <View style={styles.separator} />
    </View>
  );
};

const CallsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { calls, isLoading, loadCalls, addCall, syncCalls } = useCallStore();
  const { requestPermissions, startCallListener, loadCallLog } =
    useNativeEvents();
  const { isRTL, isDarkMode } = useTheme();

  // Dynamic colors based on theme
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const surfaceColor = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const avatarBgColor = isDarkMode ? '#3A3A3C' : '#E5E5EA';
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Load calls from device
  const loadFromDevice = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('[CallsScreen] Loading calls from device...');
        const deviceCalls = await loadCallLog();
        console.log(
          '[CallsScreen] Got calls from device:',
          deviceCalls?.length || 0,
        );

        if (deviceCalls && deviceCalls.length > 0) {
          // Add each call to the store
          deviceCalls.forEach((call: any) => {
            const formattedCall: CallLog = {
              id: String(call.id || Date.now()),
              userId: '',
              deviceId: 'android',
              phoneNumber: call.phoneNumber || call.number || '',
              contactName: call.contactName || call.name,
              type: call.type || 'incoming',
              duration: Number(call.duration) || 0,
              timestamp: Number(call.timestamp || call.date) || Date.now(),
              syncedAt: Date.now(),
            };
            addCall(formattedCall);
          });
          console.log('[CallsScreen] Calls added to store');

          // Sync to Firebase
          await syncCalls(deviceCalls);
        }
      } catch (error) {
        console.error('[CallsScreen] Error loading calls:', error);
      }
    }
  }, [loadCallLog, addCall, syncCalls]);

  // Start listening for new calls when screen mounts
  const initializeCallListener = useCallback(async () => {
    if (Platform.OS === 'android') {
      const hasPermissions = await requestPermissions();
      if (hasPermissions) {
        await startCallListener();
        console.log('[CallsScreen] Call listener started');
        // Load calls from device
        await loadFromDevice();
      }
    }
    // Load existing calls from Firebase
    loadCalls();
  }, [requestPermissions, startCallListener, loadCalls, loadFromDevice]);

  useEffect(() => {
    initializeCallListener();
  }, [initializeCallListener]);

  const groupedCalls = useMemo(() => {
    const groups: { [key: string]: GroupedCall } = {};

    calls.forEach(call => {
      const groupKey = call.phoneNumber;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          contactName: call.contactName || '',
          phoneNumber: call.phoneNumber,
          lastType: call.type,
          lastTimestamp: call.timestamp,
          lastDuration: call.duration,
          count: 1,
          calls: [call],
        };
      } else {
        groups[groupKey].count++;
        groups[groupKey].calls.push(call);
        if (call.timestamp > groups[groupKey].lastTimestamp) {
          groups[groupKey].lastTimestamp = call.timestamp;
          groups[groupKey].lastType = call.type;
          groups[groupKey].lastDuration = call.duration;
        }
        if (call.contactName && !groups[groupKey].contactName) {
          groups[groupKey].contactName = call.contactName;
        }
      }
    });

    let result = Object.values(groups).sort(
      (a, b) => b.lastTimestamp - a.lastTimestamp,
    );

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        g =>
          g.contactName.toLowerCase().includes(query) ||
          g.phoneNumber.includes(query),
      );
    }

    return result;
  }, [calls, searchQuery]);

  const handlePress = (group: GroupedCall) => {
    const lastCall = group.calls.reduce((latest, call) =>
      call.timestamp > latest.timestamp ? call : latest,
    );
    navigation.navigate('CallDetail', { call: lastCall });
  };

  const handleDelete = (group: GroupedCall) => {
    console.log('Delete call group:', group.phoneNumber);
  };

  const renderItem = ({ item }: { item: GroupedCall }) => (
    <SwipeableCallItem
      item={item}
      onPress={() => handlePress(item)}
      onDelete={() => handleDelete(item)}
      isRTL={isRTL}
      isDarkMode={isDarkMode}
      textColor={textColor}
      secondaryTextColor={secondaryTextColor}
      bgColor={bgColor}
      avatarBgColor={avatarBgColor}
    />
  );

  const renderHeader = () => <View style={styles.header} />;

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={[styles.title, { color: textColor }]}>
        {isRTL ? 'المكالمات' : 'Calls'}
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
          placeholderTextColor={isDarkMode ? '#AAAAAA' : '#666666'}
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
      <Text style={styles.emptyIcon}>📞</Text>
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        {isRTL ? 'لا توجد مكالمات' : 'No Calls'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
        {isRTL
          ? 'المكالمات الجديدة ستظهر هنا بعد حدوثها'
          : 'New calls will appear here after they occur'}
      </Text>
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
        data={groupedCalls}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadCalls}
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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
    backgroundColor: '#000000',
  },
  editButton: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 36,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    color: '#FFFFFF',
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
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  clearIcon: {
    color: '#8E8E93',
    fontSize: 16,
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  swipeContainer: {
    backgroundColor: '#000000',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionIcon: {
    fontSize: 24,
  },
  callRow: {
    backgroundColor: '#000000',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
  },
  callContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 4,
  },
  missedCallName: {
    color: '#FF3B30',
  },
  callCount: {
    color: '#8E8E93',
    fontSize: 15,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#8E8E93',
    fontSize: 15,
  },
  chevron: {
    color: '#8E8E93',
    fontSize: 18,
    marginLeft: 4,
    fontWeight: '300',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  phoneText: {
    color: '#8E8E93',
    fontSize: 15,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#38383A',
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
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CallsScreen;
