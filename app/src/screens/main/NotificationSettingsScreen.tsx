import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import Icon from 'react-native-vector-icons/Ionicons';

const NotificationSettingsScreen = ({ navigation }: any) => {
  const { colors, t, isDarkMode, isRTL } = useTheme();
  const { user } = useAuthStore();
  const settings = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic colors
  const bgColor = isDarkMode ? '#000000' : colors.background;
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;
  const secondaryTextColor = isDarkMode ? '#8E8E93' : colors.textSecondary;

  useEffect(() => {
    if (user?.uid) {
      settings.loadFromFirebase(user.uid);
    }
  }, [user?.uid]);

  const handleToggleSetting = async (key: string, value: boolean) => {
    setIsLoading(true);
    try {
      await settings.saveSetting(key, value, user?.uid);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Header with back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {t('notificationSettings')}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('smsNotifications')}
          </Text>

          <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('enableSmsNotif')}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t('enableSmsNotifDesc')}
              </Text>
            </View>
            <Switch
              value={settings.enableSmsNotifications}
              onValueChange={value =>
                handleToggleSetting('enableSmsNotifications', value)
              }
              disabled={isLoading}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={
                settings.enableSmsNotifications ? colors.success : '#f4f3f4'
              }
            />
          </View>

          <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('smsSound')}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t('smsSoundDesc')}
              </Text>
            </View>
            <Switch
              value={settings.smsSoundEnabled}
              onValueChange={value =>
                handleToggleSetting('smsSoundEnabled', value)
              }
              disabled={isLoading || !settings.enableSmsNotifications}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={settings.smsSoundEnabled ? colors.success : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('smsVibration')}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t('smsVibrationDesc')}
              </Text>
            </View>
            <Switch
              value={settings.smsVibrationEnabled}
              onValueChange={value =>
                handleToggleSetting('smsVibrationEnabled', value)
              }
              disabled={isLoading || !settings.enableSmsNotifications}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={
                settings.smsVibrationEnabled ? colors.success : '#f4f3f4'
              }
            />
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('callNotifications')}
          </Text>

          <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('enableCallNotif')}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t('enableCallNotifDesc')}
              </Text>
            </View>
            <Switch
              value={settings.enableCallNotifications}
              onValueChange={value =>
                handleToggleSetting('enableCallNotifications', value)
              }
              disabled={isLoading}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={
                settings.enableCallNotifications ? colors.success : '#f4f3f4'
              }
            />
          </View>

          <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('callSound')}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t('callSoundDesc')}
              </Text>
            </View>
            <Switch
              value={settings.callSoundEnabled}
              onValueChange={value =>
                handleToggleSetting('callSoundEnabled', value)
              }
              disabled={isLoading || !settings.enableCallNotifications}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={
                settings.callSoundEnabled ? colors.success : '#f4f3f4'
              }
            />
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('doNotDisturb')}
          </Text>

          <View style={[styles.settingItem, { borderColor: colors.border }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('enableDoNotDisturb')}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t('enableDoNotDisturbDesc')}
              </Text>
            </View>
            <Switch
              value={settings.doNotDisturbEnabled}
              onValueChange={value =>
                handleToggleSetting('doNotDisturbEnabled', value)
              }
              disabled={isLoading}
              trackColor={{ false: '#ccc', true: colors.primary }}
              thumbColor={
                settings.doNotDisturbEnabled ? colors.success : '#f4f3f4'
              }
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default NotificationSettingsScreen;
