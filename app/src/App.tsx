import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { initializeFirebase } from './services/firebase';
import { ThemeProvider } from './contexts/ThemeContext';
import { LIGHT_COLORS, DARK_COLORS } from './constants/theme';
import { useNativeEvents } from './hooks/useNativeEvents';
import ServiceStatusBanner from './components/ServiceStatusBanner';

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
    console.log('App mounted - initializing...');
    initializeFirebase();
    initialize();
  }, []);

  useEffect(() => {
    console.log('Auth state:', { isLoading, isAuthenticated, error });
  }, [isLoading, isAuthenticated, error]);

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
      <NavigationContainer theme={navigationTheme}>
        <ServiceStatusBanner />
        <RootNavigator />
      </NavigationContainer>
    </>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
