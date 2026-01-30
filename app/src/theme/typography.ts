/**
 * Typography System for iRopit App
 * Consistent text styles across the application
 */

import { Platform, TextStyle } from 'react-native';

// Font families
export const FONT_FAMILY = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
} as const;

// Font sizes
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

// Line heights
export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Font weights
export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

// Typography presets
export const TYPOGRAPHY: Record<string, TextStyle> = {
  // Headings
  h1: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES['4xl'] * LINE_HEIGHTS.tight,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES['3xl'] * LINE_HEIGHTS.tight,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: FONT_SIZES['2xl'] * LINE_HEIGHTS.tight,
  },
  h4: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.normal,
  },
  h5: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.normal,
  },
  h6: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },

  // Body text
  bodyLarge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.relaxed,
  },
  body: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.relaxed,
  },
  bodySmall: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.relaxed,
  },

  // Labels
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
  },
  labelSmall: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },

  // Captions
  caption: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },
  captionSmall: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
  },

  // Buttons
  buttonLarge: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.tight,
  },
  button: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.tight,
  },
  buttonSmall: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.tight,
  },

  // Links
  link: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
    textDecorationLine: 'underline',
  },

  // Overline
  overline: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: FONT_SIZES.xs * LINE_HEIGHTS.normal,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
} as const;

// Type definitions
export type TypographyKey = keyof typeof TYPOGRAPHY;
export type FontSizeKey = keyof typeof FONT_SIZES;
export type FontWeightKey = keyof typeof FONT_WEIGHTS;
