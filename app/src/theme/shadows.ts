/**
 * Shadow System for iRopit App
 * Consistent shadow styles for depth and elevation
 */

import { Platform, ViewStyle } from 'react-native';

// Shadow type definition
export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Light theme shadows
export const LIGHT_SHADOWS: Record<string, ShadowStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
};

// Dark theme shadows (more subtle)
export const DARK_SHADOWS: Record<string, ShadowStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 16,
  },
};

// Component-specific shadows
export const COMPONENT_SHADOWS = {
  card: 'md',
  button: 'sm',
  fab: 'lg',
  modal: 'xl',
  dropdown: 'lg',
  toast: 'md',
  bottomSheet: '2xl',
  header: 'sm',
} as const;

// Helper function to get shadows based on theme
export const getShadows = (isDarkMode: boolean) => {
  return isDarkMode ? DARK_SHADOWS : LIGHT_SHADOWS;
};

// Helper to create colored shadow (for primary buttons, etc.)
export const createColoredShadow = (
  color: string,
  size: keyof typeof LIGHT_SHADOWS = 'md',
): ViewStyle => {
  const baseShadow = LIGHT_SHADOWS[size];
  return {
    ...baseShadow,
    shadowColor: color,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : baseShadow.shadowOpacity,
  };
};

// Default export
export const SHADOWS = LIGHT_SHADOWS;

// Type definitions
export type ShadowKey = keyof typeof LIGHT_SHADOWS;
