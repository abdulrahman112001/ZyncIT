/**
 * Spacing System for iRopit App
 * Consistent spacing values across the application
 * Based on 4px grid system
 */

// Base spacing unit
const BASE_UNIT = 4;

// Spacing scale
export const SPACING = {
  /** 0px */
  none: 0,
  /** 2px */
  '2xs': BASE_UNIT * 0.5,
  /** 4px */
  xs: BASE_UNIT,
  /** 8px */
  sm: BASE_UNIT * 2,
  /** 12px */
  md: BASE_UNIT * 3,
  /** 16px */
  lg: BASE_UNIT * 4,
  /** 20px */
  xl: BASE_UNIT * 5,
  /** 24px */
  '2xl': BASE_UNIT * 6,
  /** 32px */
  '3xl': BASE_UNIT * 8,
  /** 40px */
  '4xl': BASE_UNIT * 10,
  /** 48px */
  '5xl': BASE_UNIT * 12,
  /** 64px */
  '6xl': BASE_UNIT * 16,
  /** 80px */
  '7xl': BASE_UNIT * 20,
  /** 96px */
  '8xl': BASE_UNIT * 24,
} as const;

// Border radius
export const RADIUS = {
  /** 0px */
  none: 0,
  /** 2px */
  xs: 2,
  /** 4px */
  sm: 4,
  /** 8px */
  md: 8,
  /** 12px */
  lg: 12,
  /** 16px */
  xl: 16,
  /** 20px */
  '2xl': 20,
  /** 24px */
  '3xl': 24,
  /** Full round */
  full: 9999,
} as const;

// Component-specific spacing
export const COMPONENT_SPACING = {
  // Buttons
  button: {
    paddingVertical: {
      sm: SPACING.sm,
      md: SPACING.md,
      lg: SPACING.lg,
    },
    paddingHorizontal: {
      sm: SPACING.md,
      md: SPACING.lg,
      lg: SPACING.xl,
    },
    gap: SPACING.sm,
  },

  // Inputs
  input: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
  },

  // Cards
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    gap: SPACING.md,
  },

  // Lists
  list: {
    itemPadding: SPACING.lg,
    itemGap: SPACING.sm,
    sectionGap: SPACING['2xl'],
  },

  // Screen
  screen: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },

  // Header
  header: {
    height: 56,
    paddingHorizontal: SPACING.lg,
  },

  // Bottom navigation
  bottomNav: {
    height: 64,
    paddingBottom: SPACING.sm,
  },

  // Modal
  modal: {
    padding: SPACING['2xl'],
    borderRadius: RADIUS['2xl'],
  },

  // Avatar sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
  },

  // Icon sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    '2xl': 40,
  },
} as const;

// Hit slop for touch targets (minimum 44x44 for accessibility)
export const HIT_SLOP = {
  small: { top: 8, bottom: 8, left: 8, right: 8 },
  medium: { top: 12, bottom: 12, left: 12, right: 12 },
  large: { top: 16, bottom: 16, left: 16, right: 16 },
} as const;

// Type definitions
export type SpacingKey = keyof typeof SPACING;
export type RadiusKey = keyof typeof RADIUS;
