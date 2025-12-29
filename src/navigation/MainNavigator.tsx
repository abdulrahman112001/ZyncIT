import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { MainTabParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useSettingsStore } from '../store/settingsStore';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/theme';

import NotificationsScreen from '../screens/main/NotificationsScreen';
import CallsScreen from '../screens/main/CallsScreen';
import ChatScreen from '../screens/main/ChatScreen';
import MenuNavigator from './MenuNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  const { isRTL, t } = useTheme();
  const { darkMode } = useSettingsStore();
  const colors = darkMode ? DARK_COLORS : LIGHT_COLORS;

  // Define tabs in order - will be reversed for RTL
  const tabs = [
    {
      name: 'SMS' as const,
      component: NotificationsScreen,
      titleAr: 'الإشعارات',
      titleEn: 'Notifications',
      icon: 'notifications',
    },
    {
      name: 'Chat' as const,
      component: ChatScreen,
      titleAr: 'المحادثات',
      titleEn: 'Messages',
      icon: 'chatbubbles',
    },
    {
      name: 'Calls' as const,
      component: CallsScreen,
      titleAr: 'المكالمات',
      titleEn: 'Calls',
      icon: 'call',
    },
    {
      name: 'Menu' as const,
      component: MenuNavigator,
      titleAr: 'القائمة',
      titleEn: 'Menu',
      icon: 'menu',
    },
  ];
  // Reverse order for LTR (so notifications is on left in English)
  const orderedTabs = isRTL ? tabs : [...tabs].reverse();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingTop: 8,
          paddingBottom: 25,
          height: 85,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      {orderedTabs.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: isRTL ? tab.titleAr : tab.titleEn,
            tabBarIcon: ({ color, focused }) => (
              <Icon name={focused ? tab.icon : `${tab.icon}-outline`} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

export default MainNavigator;
