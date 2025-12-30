import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';

const MenuScreen = ({ navigation }: any) => {
  const { user, signOut } = useAuthStore();
  const { colors, t } = useTheme();

  const handleSignOut = () => {
    Alert.alert(t('logout'), '', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('confirm'), style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(t('deleteAccount'), '', [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert('✓', 'Account deletion requested');
        },
      },
    ]);
  };

  const showAbout = () => {
    Alert.alert(
      'ZyncIT',
      'Version 1.0.0\n\n' +
        'ZyncIT syncs your messages and calls across devices.\n\n' +
        '© 2024 ZyncIT. All rights reserved.',
      [{ text: 'OK' }],
    );
  };

  const menuSections = [
    {
      title: t('account'),
      items: [
        {
          icon: '👤',
          title: t('accountInfo'),
          subtitle: user?.email,
          onPress: () =>
            Alert.alert(
              t('account'),
              `Email: ${user?.email}\nID: ${user?.uid?.slice(0, 8)}...`,
            ),
        },
        {
          icon: '⚙️',
          title: t('settings'),
          onPress: () => navigation.navigate('Settings'),
        },
      ],
    },
    {
      title: 'Info',
      items: [
        {
          icon: '🔒',
          title: t('privacy'),
          onPress: () => Linking.openURL('https://zyncit.app/privacy'),
        },
        {
          icon: '📄',
          title: t('terms'),
          onPress: () => Linking.openURL('https://zyncit.app/terms'),
        },
        {
          icon: 'ℹ️',
          title: t('about'),
          onPress: showAbout,
        },
      ],
    },
    {
      title: 'Actions',
      items: [
        {
          icon: '🗑️',
          title: t('deleteAccount'),
          danger: true,
          onPress: handleDeleteAccount,
        },
        {
          icon: '🚪',
          title: t('logout'),
          danger: true,
          onPress: handleSignOut,
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
        <Text style={[styles.userName, { color: colors.text }]}>
          {user?.displayName || 'ZyncIT User'}
        </Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
          {user?.email}
        </Text>
      </View>

      {menuSections.map((section, sectionIndex) => (
        <View key={sectionIndex}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {section.title}
          </Text>
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                style={[
                  styles.menuItem,
                  { borderBottomColor: colors.border },
                  itemIndex === section.items.length - 1 && styles.lastItem,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuLeft}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <View style={styles.menuText}>
                    <Text
                      style={[
                        styles.menuTitle,
                        { color: item.danger ? colors.error : colors.text },
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle && (
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
                </View>
                <Text style={[styles.arrow, { color: colors.textSecondary }]}>
                  {'>'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.version, { color: colors.textSecondary }]}>
        ZyncIT v1.0.0
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarIcon: {
    fontSize: 40,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  section: {
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    paddingVertical: 30,
  },
});

export default MenuScreen;
