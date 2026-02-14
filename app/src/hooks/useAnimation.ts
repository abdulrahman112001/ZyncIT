/**
 * useAnimation Hook
 * Provides easy-to-use animated values backed by the theme animation system
 */

import { useRef, useEffect, useCallback } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { ANIMATION_CONFIGS, STAGGER } from '../theme/animations';

type AnimationConfigKey = keyof typeof ANIMATION_CONFIGS;

/**
 * Animate a value on mount with a preset config
 */
export function useAnimatedMount(
  preset: AnimationConfigKey = 'fadeIn',
  delay: number = 0,
) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const config = ANIMATION_CONFIGS[preset];
    const animation = Animated.timing(value, {
      toValue: 1,
      ...config,
      delay,
    });
    animation.start();
    return () => animation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}

/**
 * Fade + slide-up entry animation
 * Returns { opacity, transform } style to apply to Animated.View
 */
export function useFadeSlideIn(
  delay: number = 0,
): Animated.WithAnimatedObject<ViewStyle> {
  const progress = useAnimatedMount('slideIn', delay);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };
}

/**
 * Scale-in entry animation (good for FABs, icons)
 */
export function useScaleIn(
  delay: number = 0,
): Animated.WithAnimatedObject<ViewStyle> {
  const progress = useAnimatedMount('scaleIn', delay);

  return {
    opacity: progress,
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  };
}

/**
 * Staggered list item animation
 * Pass the item index to get a staggered delay
 */
export function useListItemAnimation(
  index: number,
  speed: keyof typeof STAGGER = 'normal',
): Animated.WithAnimatedObject<ViewStyle> {
  const maxDelay = 8; // Cap stagger at 8 items to avoid long waits
  const clampedIndex = Math.min(index, maxDelay);
  return useFadeSlideIn(clampedIndex * STAGGER[speed]);
}

/**
 * Imperative animation helpers
 */
export function useAnimatedValue(initialValue: number = 0) {
  const value = useRef(new Animated.Value(initialValue)).current;

  const animateTo = useCallback(
    (
      toValue: number,
      preset: AnimationConfigKey = 'fadeIn',
      onComplete?: () => void,
    ) => {
      const config = ANIMATION_CONFIGS[preset];
      Animated.timing(value, {
        toValue,
        ...config,
      }).start(
        onComplete ? ({ finished }) => finished && onComplete() : undefined,
      );
    },
    [value],
  );

  const springTo = useCallback(
    (toValue: number, onComplete?: () => void) => {
      Animated.spring(value, {
        toValue,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start(
        onComplete ? ({ finished }) => finished && onComplete() : undefined,
      );
    },
    [value],
  );

  return { value, animateTo, springTo };
}
