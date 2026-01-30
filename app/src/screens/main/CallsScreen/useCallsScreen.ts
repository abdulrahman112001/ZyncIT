import { useEffect, useCallback, useState, useMemo } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { AlertService } from '../../../components/shared';
import { GroupedCall } from './types';
import { useCallStore } from '../../../store';
import useNativeEvents from '../../../hooks';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Custom hook to separate business logic from UI in CallsScreen
 */
export const useCallsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    calls,
    isLoading,
    loadCalls,
    clearAllCalls,
    deleteCallsByPhoneNumbers,
  } = useCallStore();
  const { requestPermissions } = useNativeEvents();
  const { isRTL, isDarkMode } = useTheme();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedCalls, setSelectedCalls] = useState<string[]>([]);

  // Theme colors
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const surfaceColor = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const avatarBgColor = isDarkMode ? '#3A3A3C' : '#E5E5EA';

  // Initialize call listener
  const initializeCallListener = useCallback(async () => {
    if (Platform.OS === 'android') {
      await requestPermissions();
    }
    loadCalls();
  }, [requestPermissions, loadCalls]);

  useEffect(() => {
    initializeCallListener();
  }, [initializeCallListener]);

  // Group calls by phone number
  const groupedCalls = useMemo(() => {
    const groups: { [key: string]: GroupedCall } = {};
    const validCalls = Array.isArray(calls) ? calls : [];

    validCalls.forEach(call => {
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

  // Handlers
  const handlePress = useCallback(
    (group: GroupedCall) => {
      const lastCall = group.calls.reduce((latest, call) =>
        call.timestamp > latest.timestamp ? call : latest,
      );
      navigation.navigate('CallDetail', { call: lastCall });
    },
    [navigation],
  );

  const handleDelete = useCallback((_group: GroupedCall) => {
    // Placeholder for future delete implementation
  }, []);

  const toggleSelectCall = useCallback((phoneNumber: string) => {
    setSelectedCalls(prev =>
      prev.includes(phoneNumber)
        ? prev.filter(p => p !== phoneNumber)
        : [...prev, phoneNumber],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedCalls.length === groupedCalls.length) {
      setSelectedCalls([]);
    } else {
      setSelectedCalls(groupedCalls.map(g => g.phoneNumber));
    }
  }, [selectedCalls.length, groupedCalls]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedCalls.length === 0) return;

    AlertService.confirmDeleteSelected(
      selectedCalls.length,
      async () => {
        await deleteCallsByPhoneNumbers(selectedCalls);
        setSelectedCalls([]);
        setIsSelectMode(false);
        AlertService.showOperationComplete(
          isRTL,
          isRTL ? 'تم حذف المكالمات المحددة' : 'Selected calls deleted',
        );
      },
      isRTL,
      'calls',
    );
  }, [selectedCalls, deleteCallsByPhoneNumbers, isRTL]);

  const handleDeleteAllCalls = useCallback(() => {
    if (groupedCalls.length === 0) {
      AlertService.show(
        isRTL ? 'لا توجد مكالمات' : 'No Calls',
        isRTL ? 'لا توجد مكالمات لحذفها' : 'There are no calls to delete',
      );
      return;
    }

    AlertService.confirmDelete({
      title: isRTL ? 'حذف كل المكالمات' : 'Delete All Calls',
      message: isRTL
        ? 'هل أنت متأكد من حذف كل سجل المكالمات؟'
        : 'Are you sure you want to delete all call logs?',
      confirmText: isRTL ? 'حذف الكل' : 'Delete All',
      onConfirm: async () => {
        await clearAllCalls();
        AlertService.showOperationComplete(
          isRTL,
          isRTL ? 'تم حذف كل المكالمات' : 'All calls deleted',
        );
      },
      isRTL,
    });
  }, [groupedCalls.length, clearAllCalls, isRTL]);

  const cancelSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedCalls([]);
  }, []);

  const enterSelectMode = useCallback(() => {
    setIsSelectMode(true);
  }, []);

  return {
    // Data
    groupedCalls,
    calls,
    searchQuery,
    isSelectMode,
    selectedCalls,
    isLoading,

    // Theme
    isRTL,
    isDarkMode,
    bgColor,
    textColor,
    secondaryTextColor,
    surfaceColor,
    avatarBgColor,

    // Handlers
    setSearchQuery,
    handlePress,
    handleDelete,
    toggleSelectCall,
    toggleSelectAll,
    handleDeleteSelected,
    handleDeleteAllCalls,
    cancelSelectMode,
    enterSelectMode,
    loadCalls,
  };
};
