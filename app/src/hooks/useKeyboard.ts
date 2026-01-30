/**
 * useKeyboard Hook
 * Manage keyboard visibility and height
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Keyboard,
  KeyboardEvent,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface KeyboardState {
  isVisible: boolean;
  keyboardHeight: number;
  /** Duration of keyboard animation in ms */
  animationDuration: number;
}

export interface UseKeyboardOptions {
  /** Enable layout animation when keyboard appears/disappears */
  useLayoutAnimation?: boolean;
}

/**
 * Hook to manage keyboard state
 */
export const useKeyboard = (
  options: UseKeyboardOptions = {},
): KeyboardState => {
  const { useLayoutAnimation: enableAnimation = false } = options;

  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    keyboardHeight: 0,
    animationDuration: 250,
  });

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      if (enableAnimation) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }

      setState({
        isVisible: true,
        keyboardHeight: event.endCoordinates.height,
        animationDuration: event.duration || 250,
      });
    };

    const handleKeyboardHide = (event: KeyboardEvent) => {
      if (enableAnimation) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }

      setState({
        isVisible: false,
        keyboardHeight: 0,
        animationDuration: event.duration || 250,
      });
    };

    const showSubscription = Keyboard.addListener(
      showEvent,
      handleKeyboardShow,
    );
    const hideSubscription = Keyboard.addListener(
      hideEvent,
      handleKeyboardHide,
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [enableAnimation]);

  return state;
};

/**
 * Hook to dismiss keyboard
 */
export const useDismissKeyboard = () => {
  return useCallback(() => {
    Keyboard.dismiss();
  }, []);
};

/**
 * Hook to check if keyboard is visible
 */
export const useIsKeyboardVisible = (): boolean => {
  const { isVisible } = useKeyboard();
  return isVisible;
};

export default useKeyboard;
