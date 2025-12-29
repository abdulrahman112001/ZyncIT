import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, CallLog } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

type CallDetailRouteProp = RouteProp<RootStackParamList, 'CallDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CallDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CallDetailRouteProp>();
  const { call } = route.params;
  const { isRTL, t, isDarkMode } = useTheme();

  // Dynamic colors based on theme
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const surfaceColor = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const cardColor = isDarkMode ? '#2C2C2E' : '#FFFFFF';
  const avatarBgColor = isDarkMode ? '#4a4a6a' : '#C7C7CC';
  const borderColor = isDarkMode ? '#3A3A3C' : '#E5E5EA';

  const getInitials = (name: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today · ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday · ${timeStr}`;
    }

    return `${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })} · ${timeStr}`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const getCallTypeLabel = (type: CallLog['type']) => {
    switch (type) {
      case 'incoming':
        return 'Incoming Call';
      case 'outgoing':
        return 'Outgoing Call';
      case 'missed':
        return 'Missed Call';
      case 'rejected':
        return 'Cancelled Call';
      default:
        return 'Call';
    }
  };

  const handleCall = () => {
    const phoneNumber = call.phoneNumber;
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make call');
    });
  };

  const handleMessage = () => {
    const phoneNumber = call.phoneNumber;
    Linking.openURL(`sms:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to open messages');
    });
  };

  const handleVideo = () => {
    Alert.alert('Video Call', 'Video calling feature coming soon');
  };

  const handleEmail = () => {
    Alert.alert('Email', 'No email address available for this contact');
  };

  const displayName = call.contactName || call.phoneNumber;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={bgColor} />

      {/* Header with gradient background */}
      <View style={[styles.headerGradient, { backgroundColor: isDarkMode ? '#1a1a2e' : '#E8E8ED' }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: isDarkMode ? '#0A84FF' : '#007AFF' }]}>‹</Text>
          <Text style={[styles.backText, { color: isDarkMode ? '#0A84FF' : '#007AFF' }]}>{isRTL ? 'المكالمات' : 'Calls'}</Text>
        </TouchableOpacity>

        {/* Large Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: avatarBgColor }]}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
        </View>

        {/* Contact Name */}
        <Text style={[styles.contactName, { color: textColor }]}>{displayName}</Text>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDarkMode ? '#3A3A3C' : '#E5E5EA' }]}>
              <Icon name="chatbubble" size={24} color="#0A84FF" />
            </View>
            <Text style={styles.actionLabel}>
              {isRTL ? 'رسالة' : 'message'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDarkMode ? '#3A3A3C' : '#E5E5EA' }]}>
              <Icon name="call" size={24} color="#0A84FF" />
            </View>
            <Text style={styles.actionLabel}>{isRTL ? 'اتصال' : 'call'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleVideo}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDarkMode ? '#3A3A3C' : '#E5E5EA' }]}>
              <Icon name="videocam" size={24} color="#0A84FF" />
            </View>
            <Text style={styles.actionLabel}>{isRTL ? 'فيديو' : 'video'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDarkMode ? '#3A3A3C' : '#E5E5EA' }]}>
              <Icon name="mail" size={24} color="#0A84FF" />
            </View>
            <Text style={styles.actionLabel}>{isRTL ? 'بريد' : 'mail'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: surfaceColor }]}>
        <TouchableOpacity style={[styles.tab, styles.activeTab, { backgroundColor: isDarkMode ? '#3A3A3C' : '#FFFFFF' }]}>
          <Text style={[styles.tabText, styles.activeTabText, { color: textColor }]}>
            {isRTL ? 'التفاصيل' : 'Details'}
          </Text>
        </TouchableOpacity>
        
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Call Info Section */}
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <View style={styles.callInfoRow}>
            <View style={styles.callTypeContainer}>
              <Icon 
                name={call.type === 'incoming' ? 'arrow-down' : call.type === 'outgoing' ? 'arrow-up' : call.type === 'missed' ? 'close-circle' : 'close'}
                size={20}
                color={call.type === 'missed' ? '#FF3B30' : '#34C759'}
                style={styles.callTypeIcon}
              />
              <View style={styles.callTypeTextContainer}>
                <Text style={[styles.callTypeLabel, { color: textColor }]}>
                  {getCallTypeLabel(call.type)}
                </Text>
                <Text style={[styles.callDateTime, { color: secondaryTextColor }]}>
                  {formatDateTime(call.timestamp)}
                </Text>
              </View>
            </View>
            {call.duration > 0 && (
              <Text style={[styles.callDuration, { color: secondaryTextColor }]}>
                {formatDuration(call.duration)}
              </Text>
            )}
          </View>
        </View>

        {/* Call History Section */}
        <TouchableOpacity style={[styles.menuRow, { backgroundColor: surfaceColor }]}>
          <Icon name="time-outline" size={20} color="#0A84FF" style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: textColor }]}>
            {isRTL ? 'سجل المكالمات' : 'Call History'}
          </Text>
          <Text style={[styles.menuChevron, { color: secondaryTextColor }]}>›</Text>
        </TouchableOpacity>

        {/* Phone Number Section */}
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>{isRTL ? 'الهاتف' : 'Phone'}</Text>
          <TouchableOpacity style={styles.phoneRow} onPress={handleCall}>
            <Text style={[styles.phoneNumber, { color: isDarkMode ? '#0A84FF' : '#007AFF' }]}>{call.phoneNumber}</Text>
            <Text style={[styles.phoneLabel, { color: secondaryTextColor }]}>{isRTL ? 'محمول' : 'mobile'}</Text>
          </TouchableOpacity>
        </View>

        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerGradient: {
    backgroundColor: '#1a1a2e',
    paddingTop: 50,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    color: '#0A84FF',
    fontSize: 28,
    fontWeight: '300',
    marginRight: 4,
  },
  backText: {
    color: '#0A84FF',
    fontSize: 17,
  },
  avatarContainer: {
    marginTop: 20,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4a4a6a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '500',
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actionButton: {
    alignItems: 'center',
    width: 70,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    color: '#0A84FF',
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3A3A3C',
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginTop: 16,
  },
  section: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  callInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTypeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  callTypeTextContainer: {
    flex: 1,
  },
  callTypeLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  callDateTime: {
    color: '#8E8E93',
    fontSize: 14,
  },
  callDuration: {
    color: '#8E8E93',
    fontSize: 14,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  menuChevron: {
    color: '#8E8E93',
    fontSize: 20,
  },
  sectionLabel: {
    color: '#8E8E93',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneNumber: {
    color: '#0A84FF',
    fontSize: 16,
  },
  phoneLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  blockRow: {
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  blockText: {
    color: '#FF3B30',
    fontSize: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 15,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default CallDetailScreen;




