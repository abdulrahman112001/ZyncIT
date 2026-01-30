import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import RootNavigator from './navigation/RootNavigator';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { initializeFirebase } from './services/firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import {
  InAppNotificationProvider,
  setGlobalNotificationHandler,
  setCurrentScreen,
  showGlobalNotification,
} from './contexts/InAppNotificationContext';
import { LIGHT_COLORS, DARK_COLORS } from './constants/theme';
import { useNativeEvents } from './hooks/useNativeEvents';
// ServiceStatusBanner is now only in MainNavigator

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const AppContent = () => {
  const { initialize, isLoading, isAuthenticated, error } = useAuthStore();
  const { darkMode } = useSettingsStore();

  // Initialize native event listeners for SMS and Calls - true to enable listening
  useNativeEvents(true);
  useEffect(() => {
    initializeFirebase();
    initialize();

    // Handle foreground FCM messages (push notifications when app is open)
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('[FCM] Foreground message received:', remoteMessage);
      // Show professional in-app toast notification (skip if on Chat screen)
      if (remoteMessage.notification) {
        showGlobalNotification({
          title: remoteMessage.notification.title || 'New Message',
          message: remoteMessage.notification.body || '',
          type: 'info',
          duration: 5000,
          skipIfOnChat: true,
        });
      }
    });

    // Handle notification opened when app is in background
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(
      remoteMessage => {
        console.log('[FCM] Notification opened app:', remoteMessage);
        // Navigate to chat screen or handle accordingly
      },
    );

    // Check if app was opened from a notification when app was quit
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            '[FCM] App opened from quit state by notification:',
            remoteMessage,
          );
          // Navigate to chat screen or handle accordingly
        }
      });

    return () => {
      unsubscribeForeground();
      unsubscribeOpenedApp();
    };
  }, []);

  // Custom navigation theme based on dark mode
  const navigationTheme = darkMode
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: DARK_COLORS.primary,
          background: DARK_COLORS.background,
          card: DARK_COLORS.surface,
          text: DARK_COLORS.text,
          border: DARK_COLORS.border,
          notification: DARK_COLORS.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: LIGHT_COLORS.primary,
          background: LIGHT_COLORS.background,
          card: LIGHT_COLORS.surface,
          text: LIGHT_COLORS.text,
          border: LIGHT_COLORS.border,
          notification: LIGHT_COLORS.primary,
        },
      };

  return (
    <>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? DARK_COLORS.surface : LIGHT_COLORS.primary}
      />
      <NavigationContainer
        theme={navigationTheme}
        onStateChange={state => {
          // Track current screen for notification filtering
          const route = state?.routes[state.index];
          if (route) {
            // Check if it's a nested navigator (like MainNavigator tabs)
            const nestedRoute = route.state?.routes?.[route.state.index];
            const screenName = nestedRoute?.name || route.name;
            setCurrentScreen(screenName);
          }
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <InAppNotificationProvider>
          <AppContent />
        </InAppNotificationProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
