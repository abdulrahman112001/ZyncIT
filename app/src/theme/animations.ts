/**
 * Animation System for iRopit App
 * Consistent animation durations and easing functions
 */

import { Easing } from 'react-native';

// Animation durations (in milliseconds)
export const DURATION = {
  /** 100ms - Very fast micro-interactions */
  instant: 100,
  /** 150ms - Fast transitions */
  fast: 150,
  /** 200ms - Quick feedback */
  quick: 200,
  /** 300ms - Normal transitions */
  normal: 300,
  /** 400ms - Moderate animations */
  moderate: 400,
  /** 500ms - Slow, deliberate animations */
  slow: 500,
  /** 700ms - Very slow, emphasis animations */
  slower: 700,
  /** 1000ms - Extra slow for special effects */
  slowest: 1000,
} as const;

// Easing functions
export const EASING = {
  // Standard easings
  linear: Easing.linear,
  ease: Easing.ease,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),

  // Cubic easings
  cubicIn: Easing.in(Easing.cubic),
  cubicOut: Easing.out(Easing.cubic),
  cubicInOut: Easing.inOut(Easing.cubic),

  // Quad easings
  quadIn: Easing.in(Easing.quad),
  quadOut: Easing.out(Easing.quad),
  quadInOut: Easing.inOut(Easing.quad),

  // Elastic (bouncy)
  elasticIn: Easing.elastic(1),
  elasticOut: Easing.out(Easing.elastic(1)),

  // Back (overshoot)
  backIn: Easing.back(1.5),
  backOut: Easing.out(Easing.back(1.5)),

  // Bounce
  bounce: Easing.bounce,

  // Bezier curves for specific use cases
  smooth: Easing.bezier(0.4, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  sharp: Easing.bezier(0.4, 0, 0.6, 1),
} as const;

// Pre-defined animation configs
export const ANIMATION_CONFIGS = {
  // Fade animations
  fadeIn: {
    duration: DURATION.normal,
    easing: EASING.easeOut,
    useNativeDriver: true,
  },
  fadeOut: {
    duration: DURATION.quick,
    easing: EASING.easeIn,
    useNativeDriver: true,
  },

  // Scale animations
  scaleIn: {
    duration: DURATION.normal,
    easing: EASING.backOut,
    useNativeDriver: true,
  },
  scaleOut: {
    duration: DURATION.quick,
    easing: EASING.easeIn,
    useNativeDriver: true,
  },

  // Slide animations
  slideIn: {
    duration: DURATION.normal,
    easing: EASING.decelerate,
    useNativeDriver: true,
  },
  slideOut: {
    duration: DURATION.quick,
    easing: EASING.accelerate,
    useNativeDriver: true,
  },

  // Spring-like animations
  spring: {
    duration: DURATION.moderate,
    easing: EASING.elasticOut,
    useNativeDriver: true,
  },

  // Button press
  buttonPress: {
    duration: DURATION.instant,
    easing: EASING.easeOut,
    useNativeDriver: true,
  },

  // Modal
  modalIn: {
    duration: DURATION.normal,
    easing: EASING.smooth,
    useNativeDriver: true,
  },
  modalOut: {
    duration: DURATION.quick,
    easing: EASING.accelerate,
    useNativeDriver: true,
  },

  // List items
  listItem: {
    duration: DURATION.quick,
    easing: EASING.easeOut,
    useNativeDriver: true,
  },

  // Skeleton shimmer
  skeleton: {
    duration: DURATION.slowest,
    easing: EASING.linear,
    useNativeDriver: true,
  },
} as const;

// Stagger delays for list animations
export const STAGGER = {
  fast: 30,
  normal: 50,
  slow: 100,
} as const;

// Type definitions
export type DurationKey = keyof typeof DURATION;
export type EasingKey = keyof typeof EASING;
export type AnimationConfigKey = keyof typeof ANIMATION_CONFIGS;
