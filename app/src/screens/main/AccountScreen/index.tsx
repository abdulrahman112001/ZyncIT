import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button } from '../../../components';
import { styles } from './styles';
import { useAccountScreen } from './useAccountScreen';

const AccountScreen = () => {
  const { user, isRTL, handleSignOut } = useAccountScreen();
  const { colors, t, isDarkMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Icon name="person-circle" size={80} color={colors.primary} />
        <Text style={[styles.email, { color: colors.text }]}>
          {user?.email || t('noEmail')}
        </Text>
      </View>
      <Button
        title={t('signOut')}
        variant="danger"
        leftIcon="log-out-outline"
        onPress={handleSignOut}
        isDark={isDarkMode}
        style={styles.signOutBtn}
      />
    </View>
  );
};

export default AccountScreen;
