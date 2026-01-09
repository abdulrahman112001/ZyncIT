import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuthStore();
  const settings = useSettingsStore();
  const { colors, t, isDarkMode, isRTL } = useTheme();

  // Dynamic colors
  const bgColor = isDarkMode ? '#000000' : colors.background;
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;
  const secondaryTextColor = isDarkMode ? '#8E8E93' : colors.textSecondary;

  useEffect(() => {
    if (user?.uid) {
      settings.loadFromFirebase(user.uid);
    }
  }, [user?.uid]);

  const handleLogout = () => {
    Alert.alert(
      isRTL ? 'تسجيل الخروج' : 'Logout',
      isRTL ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to logout?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'خروج' : 'Logout',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      isRTL ? 'حذف الحساب' : 'Delete Account',
      isRTL
        ? 'هل أنت متأكد؟ سيتم حذف جميع بياناتك نهائياً ولا يمكن استعادتها.'
        : 'Are you sure? All your data will be permanently deleted and cannot be recovered.',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user data from Firebase then delete account
              // For now just logout, full account deletion needs backend support
              Alert.alert(
                isRTL ? 'تواصل معنا' : 'Contact Us',
                isRTL
                  ? 'لحذف حسابك نهائياً، تواصل معنا على support@zyncit.app'
                  : 'To permanently delete your account, contact us at support@zyncit.app',
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

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
      <Icon
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={colors.textSecondary}
      />
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Header with back button and title inline */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {t('deviceSettings')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={[styles.scrollContent, { backgroundColor: bgColor }]}>
        {/* Notifications Section */}
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          🔔 {t('notifications')}
        </Text>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
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

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.surface }]}
          onPress={handleLogout}
        >
          <Icon
            name="log-out-outline"
            size={22}
            color="#FF9500"
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.logoutButtonText, { color: colors.text }]}>
            {isRTL ? 'تسجيل الخروج' : 'Logout'}
          </Text>
        </TouchableOpacity>

        {/* Delete Account Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.surface }]}
          onPress={handleDeleteAccount}
        >
          <Icon
            name="trash-outline"
            size={22}
            color="#FF3B30"
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.deleteButtonText]}>
            {isRTL ? 'حذف الحساب' : 'Delete Account'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 30,
    padding: 15,
    borderRadius: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 12,
    padding: 15,
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
});

export default SettingsScreen;
