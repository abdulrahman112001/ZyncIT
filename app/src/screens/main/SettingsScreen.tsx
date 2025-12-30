import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';

const SettingsScreen = () => {
  const { user } = useAuthStore();
  const settings = useSettingsStore();
  const { colors, t, isDarkMode } = useTheme();

  useEffect(() => {
    if (user?.uid) {
      settings.loadFromFirebase(user.uid);
    }
  }, [user?.uid]);

  const saveAndSync = async (key: string, value: any) => {
    await settings.updateSetting(key as any, value);
    if (user?.uid) {
      await settings.syncToFirebase(user.uid);
    }
  };

  const SettingSwitch = ({ title, subtitle, value, settingKey }: any) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={styles.settingLeft}>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.settingSubtitle, { color: colors.textSecondary }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={val => saveAndSync(settingKey, val)}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const SettingOption = ({ title, value, onPress }: any) => (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text
            style={[styles.settingSubtitle, { color: colors.textSecondary }]}
          >
            {value}
          </Text>
        </View>
      </View>
      <Text style={[styles.arrow, { color: colors.textSecondary }]}>{'>'}</Text>
    </TouchableOpacity>
  );

  const showSyncIntervalPicker = () => {
    Alert.alert(t('syncInterval'), '', [
      { text: t('everyMinute'), onPress: () => saveAndSync('syncInterval', 1) },
      {
        text: t('every5Minutes'),
        onPress: () => saveAndSync('syncInterval', 5),
      },
      {
        text: t('every15Minutes'),
        onPress: () => saveAndSync('syncInterval', 15),
      },
      {
        text: t('every30Minutes'),
        onPress: () => saveAndSync('syncInterval', 30),
      },
      { text: t('everyHour'), onPress: () => saveAndSync('syncInterval', 60) },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const showLanguagePicker = () => {
    Alert.alert(t('language'), '', [
      { text: t('arabic'), onPress: () => saveAndSync('language', 'ar') },
      { text: t('english'), onPress: () => saveAndSync('language', 'en') },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const getSyncIntervalText = () => {
    const interval = settings.syncInterval;
    if (interval === 1) return t('everyMinute');
    if (interval === 60) return t('everyHour');
    return settings.language === 'ar'
      ? `كل ${interval} دقيقة`
      : `Every ${interval} minutes`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Notifications Section */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        🔔 {t('notifications')}
      </Text>
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <SettingSwitch
          title={t('smsNotifications')}
          value={settings.smsNotifications}
          settingKey="smsNotifications"
        />
        <SettingSwitch
          title={t('callNotifications')}
          value={settings.callNotifications}
          settingKey="callNotifications"
        />
        <SettingSwitch
          title={t('chatNotifications')}
          value={settings.chatNotifications}
          settingKey="chatNotifications"
        />
        <SettingSwitch
          title={t('notificationSound')}
          value={settings.notificationSound}
          settingKey="notificationSound"
        />
      </View>

      {/* Sync Section */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        🔄 {t('sync')}
      </Text>
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <SettingSwitch
          title={t('autoSync')}
          value={settings.autoSync}
          settingKey="autoSync"
        />
        <SettingSwitch
          title={t('wifiOnly')}
          value={settings.wifiOnlySync}
          settingKey="wifiOnlySync"
        />
        <SettingOption
          title={t('syncInterval')}
          value={getSyncIntervalText()}
          onPress={showSyncIntervalPicker}
        />
      </View>

      {/* Appearance Section */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        🎨 {t('appearance')}
      </Text>
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <SettingSwitch
          title={t('darkMode')}
          value={settings.darkMode}
          settingKey="darkMode"
        />
        <SettingOption
          title={t('language')}
          value={settings.language === 'ar' ? t('arabic') : t('english')}
          onPress={showLanguagePicker}
        />
      </View>

      {/* Security Section */}
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        🔒 {t('security')}
      </Text>
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <SettingSwitch
          title={t('appLock')}
          value={settings.appLock}
          settingKey="appLock"
        />
        <SettingSwitch
          title={t('biometric')}
          value={settings.biometricLock}
          settingKey="biometricLock"
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  section: {
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
  },
});

export default SettingsScreen;
