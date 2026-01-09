import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const MenuScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuthStore();
  const settings = useSettingsStore();
  const { colors, t, isDarkMode, isRTL } = useTheme();

  const saveAndSync = async (key: string, value: any) => {
    await settings.updateSetting(key as any, value);
    if (user?.uid) {
      await settings.syncToFirebase(user.uid);
    }
  };

  const showLanguagePicker = () => {
    Alert.alert(t('language'), '', [
      { text: t('arabic'), onPress: () => saveAndSync('language', 'ar') },
      { text: t('english'), onPress: () => saveAndSync('language', 'en') },
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

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
          onPress: () => {
            Alert.alert(
              isRTL ? 'تواصل معنا' : 'Contact Us',
              isRTL
                ? 'لحذف حسابك نهائياً، تواصل معنا على support@zyncit.app'
                : 'To permanently delete your account, contact us at support@zyncit.app',
            );
          },
        },
      ],
    );
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Dynamic colors for iOS-like design
  const bgColor = isDarkMode ? '#000000' : colors.background;
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;
  const secondaryTextColor = isDarkMode ? '#8E8E93' : colors.textSecondary;

  const menuSections = [
    {
      title: t('appearance'),
      items: [
        {
          icon: 'moon-outline',
          title: t('darkMode'),
          subtitle: isDarkMode ? t('on') : t('off'),
          danger: false,
          isSwitch: true,
          value: settings.darkMode,
          settingKey: 'darkMode',
        },
        {
          icon: 'language-outline',
          title: t('language'),
          subtitle: settings.language === 'ar' ? t('arabic') : t('english'),
          danger: false,
          onPress: showLanguagePicker,
        },
      ],
    },
    {
      title: t('legalPrivacy'),
      items: [
        {
          icon: 'shield-checkmark-outline',
          title: t('privacy'),
          subtitle: t('protectData'),
          danger: false,
          onPress: () => navigation.navigate('PrivacyPolicy'),
        },
        {
          icon: 'document-text-outline',
          title: t('terms'),
          subtitle: t('termsConditions'),
          danger: false,
          onPress: () => navigation.navigate('TermsOfService'),
        },
      ],
    },
    {
      title: t('account'),
      items: [
        {
          icon: 'log-out-outline',
          title: isRTL ? 'تسجيل الخروج' : 'Logout',
          subtitle: '',
          danger: false,
          iconColor: '#FF9500',
          onPress: handleLogout,
        },
        {
          icon: 'trash-outline',
          title: isRTL ? 'حذف الحساب' : 'Delete Account',
          subtitle: '',
          danger: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Title like Notifications Screen */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {t('menuTitle')}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Header - Improved Design */}
        <TouchableOpacity
          style={[styles.profileHeader, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('UserSettings')}
          activeOpacity={0.7}
        >
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <View
              style={[styles.profileImage, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.profileInitials}>
                {getInitials(user?.displayName || 'User')}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {user?.displayName || 'ZyncIT User'}
            </Text>
            <Text
              style={[styles.profileEmail, { color: colors.textSecondary }]}
            >
              {user?.email}
            </Text>
          </View>

          <Icon
            name={isRTL ? 'chevron-back' : 'chevron-forward'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            <Text
              style={[styles.sectionTitle, { color: colors.textSecondary }]}
            >
              {section.title}
            </Text>

            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              {section.items.map((item: any, itemIndex: number) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    { borderBottomColor: colors.border },
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                  onPress={item.isSwitch ? undefined : item.onPress}
                  activeOpacity={item.isSwitch ? 1 : 0.7}
                >
                  <Icon
                    name={item.icon}
                    size={24}
                    color={
                      item.iconColor ||
                      (item.danger ? colors.error : colors.primary)
                    }
                    style={styles.menuIcon}
                  />

                  <View style={styles.menuContent}>
                    <Text
                      style={[
                        styles.menuTitle,
                        { color: item.danger ? colors.error : colors.text },
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle && !item.isSwitch && (
                      <Text
                        style={[
                          styles.menuSubtitle,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    )}
                  </View>

                  {item.isSwitch ? (
                    <Switch
                      value={item.value}
                      onValueChange={val => saveAndSync(item.settingKey, val)}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor={item.value ? '#fff' : '#f4f3f4'}
                    />
                  ) : (
                    <Icon
                      name={isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.version, { color: colors.textSecondary }]}>
          ZyncIT v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 24,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginVertical: 20,
  },
});

export default MenuScreen;
