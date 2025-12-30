import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuScreen from '../screens/main/MenuScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
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
        options={{ title: t('menu') }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('settings') }}
      />
    </Stack.Navigator>
  );
};

export default MenuNavigator;
