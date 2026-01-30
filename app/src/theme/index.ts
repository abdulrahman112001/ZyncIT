/**
 * Theme System - Main Export
 * Centralized theme exports for iRopit App
 */

// Colors
export {
  LIGHT_COLORS,
  DARK_COLORS,
  COLORS,
  colors,
  getColors,
  type ColorTheme,
  type ColorKey,
} from './colors';

// Typography
export {
  FONT_FAMILY,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  TYPOGRAPHY,
  type TypographyKey,
  type FontSizeKey,
  type FontWeightKey,
} from './typography';

// Spacing
export {
  SPACING,
  RADIUS,
  COMPONENT_SPACING,
  HIT_SLOP,
  type SpacingKey,
  type RadiusKey,
} from './spacing';

// Shadows
export {
  SHADOWS,
  LIGHT_SHADOWS,
  DARK_SHADOWS,
  COMPONENT_SHADOWS,
  getShadows,
  createColoredShadow,
  type ShadowStyle,
  type ShadowKey,
} from './shadows';

// Animations
export {
  DURATION,
  EASING,
  ANIMATION_CONFIGS,
  STAGGER,
  type DurationKey,
  type EasingKey,
  type AnimationConfigKey,
} from './animations';

// Legacy exports for backward compatibility
export { COLORS as FONTS } from './colors';

// Theme hook helper type
export interface Theme {
  colors: typeof import('./colors').LIGHT_COLORS;
  typography: typeof import('./typography').TYPOGRAPHY;
  spacing: typeof import('./spacing').SPACING;
  radius: typeof import('./spacing').RADIUS;
  shadows: typeof import('./shadows').LIGHT_SHADOWS;
  isDark: boolean;
}

// Create theme object
export const createTheme = (isDarkMode: boolean): Theme => {
  const { getColors, LIGHT_COLORS, DARK_COLORS } = require('./colors');
  const { TYPOGRAPHY } = require('./typography');
  const { SPACING, RADIUS } = require('./spacing');
  const { getShadows } = require('./shadows');

  return {
    colors: isDarkMode ? DARK_COLORS : LIGHT_COLORS,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    radius: RADIUS,
    shadows: getShadows(isDarkMode),
    isDark: isDarkMode,
  };
};
