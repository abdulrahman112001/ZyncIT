import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';
import { Button, Input, Divider, IconButton } from '../../../components';
import { useLoading, useToggle } from '../../../hooks';
import { styles } from './styles';
import { SignUpScreenProps } from './types';

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [showPassword, toggleShowPassword] = useToggle(false);
  const { isLoading, startLoading, stopLoading } = useLoading();
  const { colors, t, isDarkMode, isRTL } = useTheme();

  const { signUpWithEmail, signInWithGoogle } = useAuthStore();

  const clearErrors = useCallback(() => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');
  }, []);

  const handleSignUp = useCallback(async () => {
    clearErrors();
    let hasError = false;

    if (!name.trim()) {
      setNameError(t('nameRequired'));
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError(t('emailRequired'));
      hasError = true;
    }

    if (!password) {
      setPasswordError(t('passwordRequired'));
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError(t('passwordMinLength'));
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('confirmPasswordRequired'));
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('passwordsNotMatch'));
      hasError = true;
    }

    if (hasError) return;

    startLoading();
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
    } catch (e: any) {
      setGeneralError(e.message || t('signUpFailed'));
    }
    stopLoading();
  }, [
    name,
    email,
    password,
    confirmPassword,
    signUpWithEmail,
    startLoading,
    stopLoading,
    t,
    clearErrors,
  ]);

  const handleGoogleSignUp = useCallback(async () => {
    clearErrors();
    startLoading();
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setGeneralError(e.message || t('googleSignUpFailed'));
    }
    stopLoading();
  }, [signInWithGoogle, startLoading, stopLoading, t, clearErrors]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <IconButton
            icon={isRTL ? 'chevron-forward' : 'chevron-back'}
            onPress={() => navigation.goBack()}
            variant="ghost"
            isDark={isDarkMode}
            style={styles.backButton}
          />

          {/* Header */}
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('createAccount')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('signUpSubtitle')}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* General Error */}
            {generalError ? (
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: colors.error + '15',
                    borderColor: colors.error,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {generalError}
                </Text>
              </View>
            ) : null}

            {/* Name Input */}
            <Input
              placeholder={t('fullName')}
              value={name}
              onChangeText={text => {
                setName(text);
                if (nameError) setNameError('');
              }}
              autoCapitalize="words"
              leftIcon="person-outline"
              isDark={isDarkMode}
              error={nameError}
            />

            {/* Email Input */}
            <Input
              placeholder={t('email')}
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
              isDark={isDarkMode}
              error={emailError}
            />

            {/* Password Input */}
            <Input
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={toggleShowPassword}
              isDark={isDarkMode}
              error={passwordError}
            />

            {/* Confirm Password Input */}
            <Input
              placeholder={t('confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (confirmPasswordError) setConfirmPasswordError('');
              }}
              secureTextEntry={!showPassword}
              leftIcon="lock-closed-outline"
              isDark={isDarkMode}
              error={confirmPasswordError}
            />

            {/* Sign Up Button */}
            <Button
              title={isLoading ? t('creatingAccount') : t('signUpButton')}
              onPress={handleSignUp}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              isDark={isDarkMode}
            />

            {/* Divider */}
            <Divider label={t('orDivider')} isDark={isDarkMode} />

            {/* Google Sign Up */}
            <Button
              title={t('googleSignUp')}
              variant="outline"
              leftIcon="logo-google"
              onPress={handleGoogleSignUp}
              disabled={isLoading}
              fullWidth
              isDark={isDarkMode}
            />

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text
                style={[styles.signInText, { color: colors.textSecondary }]}
              >
                {t('hasAccount')}{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={[styles.signInLink, { color: colors.primary }]}>
                  {t('signIn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
