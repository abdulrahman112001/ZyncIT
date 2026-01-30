import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../contexts/ThemeContext';

export const useAccountScreen = () => {
  const { user, signOut } = useAuthStore();
  const { isRTL, isDarkMode } = useTheme();

  const handleSignOut = useCallback(() => {
    Alert.alert(
      isRTL ? 'تسجيل الخروج' : 'Sign Out',
      isRTL ? 'هل أنت متأكد؟' : 'Are you sure?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'تسجيل الخروج' : 'Sign Out',
          style: 'destructive',
          onPress: signOut,
        },
      ],
    );
  }, [isRTL, signOut]);

  return {
    user,
    isRTL,
    isDarkMode,
    handleSignOut,
  };
};
