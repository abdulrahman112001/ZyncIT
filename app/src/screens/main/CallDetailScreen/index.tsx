import React, { useMemo } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCallStore } from '../../../store/callStore';

import { styles } from './styles';
import {
  getInitials,
  formatDateTime,
  formatDuration,
  getCallTypeLabel,
  getCallTypeIcon,
} from './helper';

type CallDetailRouteProp = RouteProp<RootStackParamList, 'CallDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CallDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CallDetailRouteProp>();
  const { call } = route.params;
  const { isRTL, t, isDarkMode } = useTheme();
  const { calls } = useCallStore();

  // Get all calls for this phone number
  const callHistory = useMemo(() => {
    return calls
      .filter(c => c.phoneNumber === call.phoneNumber)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [calls, call.phoneNumber]);

  // Dynamic colors based on theme
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const surfaceColor = isDarkMode ? '#1C1C1E' : '#F2F2F7';
  const avatarBgColor = isDarkMode ? '#4a4a6a' : '#C7C7CC';
  const borderColor = isDarkMode ? '#3A3A3C' : '#E5E5EA';

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
    const phoneNumber = call.phoneNumber;
    Linking.canOpenURL('facetime://')
      .then(supported => {
        if (supported) {
          Linking.openURL(`facetime:${phoneNumber}`);
        } else {
          Linking.canOpenURL('https://duo.google.com').then(duoSupported => {
            if (duoSupported) {
              Linking.openURL(`https://duo.google.com/call/${phoneNumber}`);
            } else {
              const whatsappUrl = `whatsapp://send?phone=${phoneNumber.replace(
                /[^0-9]/g,
                '',
              )}`;
              Linking.canOpenURL(whatsappUrl).then(waSupported => {
                if (waSupported) {
                  Linking.openURL(whatsappUrl);
                } else {
                  Alert.alert(
                    'Video Call',
                    'No video calling app available. Please install WhatsApp, Duo, or FaceTime.',
                  );
                }
              });
            }
          });
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Unable to initiate video call');
      });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:').catch(() => {
      Alert.alert('Error', 'Unable to open email app');
    });
  };

  const displayName = call.contactName || call.phoneNumber;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Header with gradient background */}
      <View
        style={[
          styles.headerGradient,
          { backgroundColor: isDarkMode ? '#1a1a2e' : '#E8E8ED' },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text
            style={[
              styles.backIcon,
              { color: isDarkMode ? '#0A84FF' : '#007AFF' },
            ]}
          >
            ‹
          </Text>
          <Text
            style={[
              styles.backText,
              { color: isDarkMode ? '#0A84FF' : '#007AFF' },
            ]}
          >
            {isRTL ? 'المكالمات' : 'Calls'}
          </Text>
        </TouchableOpacity>

        {/* Large Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: avatarBgColor }]}>
            <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
          </View>
        </View>

        {/* Contact Name */}
        <Text style={[styles.contactName, { color: textColor }]}>
          {displayName}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: isDarkMode ? '#3A3A3C' : '#E5E5EA' },
              ]}
            >
              <Icon name="chatbubble" size={24} color="#0A84FF" />
            </View>
            <Text style={styles.actionLabel}>
              {isRTL ? 'رسالة' : 'message'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: isDarkMode ? '#3A3A3C' : '#E5E5EA' },
              ]}
            >
              <Icon name="call" size={24} color="#0A84FF" />
            </View>
            <Text style={styles.actionLabel}>{isRTL ? 'اتصال' : 'call'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
            <View
              style={[
                styles.actionIconContainer,
                { backgroundColor: isDarkMode ? '#3A3A3C' : '#E5E5EA' },
              ]}
            >
              <Icon name="mail" size={24} color="#0A84FF" />
            </View>
            <Text style={styles.actionLabel}>{isRTL ? 'بريد' : 'mail'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: surfaceColor }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            styles.activeTab,
            { backgroundColor: isDarkMode ? '#3A3A3C' : '#FFFFFF' },
          ]}
        >
          <Text
            style={[styles.tabText, styles.activeTabText, { color: textColor }]}
          >
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
                name={getCallTypeIcon(call.type)}
                size={20}
                color={call.type === 'missed' ? '#FF3B30' : '#34C759'}
                style={styles.callTypeIcon}
              />
              <View style={styles.callTypeTextContainer}>
                <Text style={[styles.callTypeLabel, { color: textColor }]}>
                  {getCallTypeLabel(call.type)}
                </Text>
                <Text
                  style={[styles.callDateTime, { color: secondaryTextColor }]}
                >
                  {formatDateTime(call.timestamp)}
                </Text>
              </View>
            </View>
            {call.duration > 0 && (
              <Text
                style={[styles.callDuration, { color: secondaryTextColor }]}
              >
                {formatDuration(call.duration)}
              </Text>
            )}
          </View>
        </View>

        {/* Call History Section */}
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <View style={styles.sectionHeader}>
            <Icon name="time-outline" size={20} color="#0A84FF" />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {isRTL ? 'سجل المكالمات' : 'Call History'} ({callHistory.length})
            </Text>
          </View>

          {callHistory.map((historyCall, index) => (
            <View
              key={historyCall.id}
              style={[
                styles.historyItem,
                index < callHistory.length - 1 && {
                  borderBottomWidth: 0.5,
                  borderBottomColor: borderColor,
                },
              ]}
            >
              <Icon
                name={getCallTypeIcon(historyCall.type)}
                size={18}
                color={historyCall.type === 'missed' ? '#FF3B30' : '#34C759'}
              />
              <View style={styles.historyInfo}>
                <Text style={[styles.historyType, { color: textColor }]}>
                  {getCallTypeLabel(historyCall.type)}
                </Text>
                <Text
                  style={[styles.historyTime, { color: secondaryTextColor }]}
                >
                  {formatDateTime(historyCall.timestamp)}
                </Text>
              </View>
              {historyCall.duration > 0 && (
                <Text
                  style={[
                    styles.historyDuration,
                    { color: secondaryTextColor },
                  ]}
                >
                  {formatDuration(historyCall.duration)}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Phone Number Section */}
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <Text style={[styles.sectionLabel, { color: secondaryTextColor }]}>
            {isRTL ? 'الهاتف' : 'Phone'}
          </Text>
          <TouchableOpacity style={styles.phoneRow} onPress={handleCall}>
            <Text
              style={[
                styles.phoneNumber,
                { color: isDarkMode ? '#0A84FF' : '#007AFF' },
              ]}
            >
              {call.phoneNumber}
            </Text>
            <Text style={[styles.phoneLabel, { color: secondaryTextColor }]}>
              {isRTL ? 'محمول' : 'mobile'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default CallDetailScreen;
