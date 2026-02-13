// Light Theme Colors
export const LIGHT_COLORS = {
  primary: '#D5C19E',
  primaryDark: '#B8A07A',
  primaryLight: '#E8DCC6',
  secondary: '#10B981',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  incoming: '#10B981',
  outgoing: '#3B82F6',
  missed: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  card: '#FFFFFF',
  notification: '#D5C19E',
};

// Dark Theme Colors
export const DARK_COLORS = {
  primary: '#E0D0B3',
  primaryDark: '#D5C19E',
  primaryLight: '#EBE1CF',
  secondary: '#34D399',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textLight: '#6B7280',
  border: '#374151',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',
  incoming: '#34D399',
  outgoing: '#60A5FA',
  missed: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  card: '#1F2937',
  notification: '#E0D0B3',
};

// Default to light colors for backward compatibility
export const COLORS = LIGHT_COLORS;
export const colors = COLORS;

export const FONTS = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Helper function to get colors based on dark mode
export const getColors = (isDarkMode: boolean) => {
  return isDarkMode ? DARK_COLORS : LIGHT_COLORS;
};
