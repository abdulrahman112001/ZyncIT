import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../store/authStore';
import { Button, Input, IconButton } from '../../../components';
import { useLoading, useToggle } from '../../../hooks';
import auth from '@react-native-firebase/auth';

import { ChangePasswordScreenProps } from './types';
import { styles } from './styles';

const ChangePasswordScreen = ({ navigation }: ChangePasswordScreenProps) => {
  const { colors, t, isDarkMode, isRTL } = useTheme();
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { isLoading, startLoading, stopLoading } = useLoading();
  const [showCurrentPassword, toggleCurrentPassword] = useToggle(false);
  const [showNewPassword, toggleNewPassword] = useToggle(false);
  const [showConfirmPassword, toggleConfirmPassword] = useToggle(false);

  const bgColor = isDarkMode ? '#000000' : colors.background;
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;

  const handleChangePassword = useCallback(async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('userSettings.fillAllFields'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('userSettings.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('userSettings.passwordsDoNotMatch'));
      return;
    }

    startLoading();
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('User not found');
      }

      // Re-authenticate user with current password
      const credential = auth.EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await currentUser.reauthenticateWithCredential(credential);

      // Update password
      await currentUser.updatePassword(newPassword);

      Alert.alert(t('common.success'), t('userSettings.passwordChanged'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      let message = error.message;
      if (error.code === 'auth/wrong-password') {
        message = t('userSettings.wrongPassword');
      } else if (error.code === 'auth/weak-password') {
        message = t('userSettings.weakPassword');
      } else if (error.code === 'auth/requires-recent-login') {
        message = t('userSettings.recentLoginRequired');
      }
      Alert.alert(t('common.error'), message);
    } finally {
      stopLoading();
    }
  }, [
    currentPassword,
    newPassword,
    confirmPassword,
    navigation,
    startLoading,
    stopLoading,
    t,
  ]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Header */}
      <View style={styles.headerRow}>
        <IconButton
          icon={isRTL ? 'chevron-forward' : 'chevron-back'}
          onPress={() => navigation.goBack()}
          variant="ghost"
          isDark={isDarkMode}
        />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {t('userSettings.changePassword')}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Current Password */}
        <Input
          label={t('userSettings.currentPassword')}
          placeholder={t('userSettings.enterCurrentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showCurrentPassword}
          rightIcon={showCurrentPassword ? 'eye-off' : 'eye'}
          onRightIconPress={toggleCurrentPassword}
          autoCapitalize="none"
          isDark={isDarkMode}
          containerStyle={styles.inputSpacing}
        />

        {/* New Password */}
        <Input
          label={t('userSettings.newPassword')}
          placeholder={t('userSettings.enterNewPassword')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          rightIcon={showNewPassword ? 'eye-off' : 'eye'}
          onRightIconPress={toggleNewPassword}
          autoCapitalize="none"
          isDark={isDarkMode}
          containerStyle={styles.inputSpacing}
        />

        {/* Confirm Password */}
        <Input
          label={t('userSettings.confirmPassword')}
          placeholder={t('userSettings.confirmNewPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          rightIcon={showConfirmPassword ? 'eye-off' : 'eye'}
          onRightIconPress={toggleConfirmPassword}
          autoCapitalize="none"
          isDark={isDarkMode}
          containerStyle={styles.inputSpacing}
        />

        {/* Change Password Button */}
        <Button
          title={t('userSettings.changePassword')}
          onPress={handleChangePassword}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          isDark={isDarkMode}
          style={styles.buttonSpacing}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;
