import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingScreen from '../screens/LoadingScreen';
import ConversationScreen from '../screens/main/ConversationScreen';
import CallDetailScreen from '../screens/main/CallDetailScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { checkOnboardingComplete } from '../screens/onboarding/OnboardingScreen/useOnboarding';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { colors } = useTheme();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await checkOnboardingComplete();
      setHasCompletedOnboarding(completed);
      setCheckingOnboarding(false);
    };
    checkOnboarding();
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  if (isLoading || checkingOnboarding) {
    return <LoadingScreen />;
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Conversation"
            component={ConversationScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="CallDetail"
            component={CallDetailScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
