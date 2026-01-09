import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from '../screens/main/MenuScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import UserSettingsScreen from '../screens/main/UserSettingsScreen';
import ChangePasswordScreen from '../screens/main/ChangePasswordScreen';
import NotificationSettingsScreen from '../screens/main/NotificationSettingsScreen';
import PrivacyPolicyScreen from '../screens/main/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/main/TermsOfServiceScreen';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createNativeStackNavigator();

const MenuNavigator = () => {
  const { colors, t } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: '#FFFFFF',
        },
        headerTintColor: '#FFFFFF',
        headerBackTitle: t('back'),
      }}
    >
      <Stack.Screen
        name="MenuHome"
        component={MenuScreen}
        options={{ title: t('menu'), headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings'), headerShown: false }}
      />
      <Stack.Screen
        name="UserSettings"
        component={UserSettingsScreen}
        options={{ title: 'User Settings', headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password', headerShown: false }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: 'Notification Settings', headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy', headerShown: false }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: 'Terms of Service', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default MenuNavigator;
