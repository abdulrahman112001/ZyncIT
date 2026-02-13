/**
 * Color System for iRopit App
 * Centralized color definitions for light and dark themes
 */

// Light Theme Colors
export const LIGHT_COLORS = {
  // Primary brand colors
  primary: '#D5C19E',
  primaryDark: '#B8A07A',
  primaryLight: '#E8DCC6',
  primarySoft: '#F7F3EC',

  // Secondary colors
  secondary: '#10B981',
  secondaryDark: '#059669',
  secondaryLight: '#34D399',

  // Backgrounds
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  surfaceTertiary: '#E5E7EB',

  // Text
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',

  // Status colors
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorDark: '#DC2626',

  success: '#10B981',
  successLight: '#D1FAE5',
  successDark: '#059669',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#D97706',

  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoDark: '#2563EB',

  // Call status
  incoming: '#10B981',
  outgoing: '#3B82F6',
  missed: '#EF4444',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Components
  card: '#FFFFFF',
  cardHover: '#F9FAFB',
  notification: '#D5C19E',
  skeleton: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',

  // Input
  inputBackground: '#FFFFFF',
  inputBorder: '#D1D5DB',
  inputFocus: '#D5C19E',
  inputPlaceholder: '#9CA3AF',
  inputDisabled: '#F3F4F6',
} as const;

// Dark Theme Colors
export const DARK_COLORS = {
  // Primary brand colors
  primary: '#E0D0B3',
  primaryDark: '#D5C19E',
  primaryLight: '#EBE1CF',
  primarySoft: '#2D2820',

  // Secondary colors
  secondary: '#34D399',
  secondaryDark: '#10B981',
  secondaryLight: '#6EE7B7',

  // Backgrounds
  background: '#111827',
  surface: '#1F2937',
  surfaceSecondary: '#374151',
  surfaceTertiary: '#4B5563',

  // Text
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textInverse: '#1F2937',

  // Borders
  border: '#374151',
  borderLight: '#4B5563',
  borderDark: '#1F2937',

  // Status colors
  error: '#F87171',
  errorLight: '#7F1D1D',
  errorDark: '#EF4444',

  success: '#34D399',
  successLight: '#064E3B',
  successDark: '#10B981',

  warning: '#FBBF24',
  warningLight: '#78350F',
  warningDark: '#F59E0B',

  info: '#60A5FA',
  infoLight: '#1E3A8A',
  infoDark: '#3B82F6',

  // Call status
  incoming: '#34D399',
  outgoing: '#60A5FA',
  missed: '#F87171',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Components
  card: '#1F2937',
  cardHover: '#374151',
  notification: '#E0D0B3',
  skeleton: '#374151',
  skeletonHighlight: '#4B5563',

  // Input
  inputBackground: '#1F2937',
  inputBorder: '#4B5563',
  inputFocus: '#E0D0B3',
  inputPlaceholder: '#6B7280',
  inputDisabled: '#374151',
} as const;

// Type definitions
export type ColorTheme = typeof LIGHT_COLORS;
export type ColorKey = keyof ColorTheme;

// Helper function to get colors based on dark mode
export const getColors = (isDarkMode: boolean): ColorTheme => {
  return isDarkMode ? DARK_COLORS : LIGHT_COLORS;
};

// Default export for backward compatibility
export const COLORS = LIGHT_COLORS;
export const colors = COLORS;
