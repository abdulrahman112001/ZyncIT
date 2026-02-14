/**
 * Legacy Theme Constants - Re-exports from canonical theme system
 * All definitions now live in ../theme/ directory
 * For new code, import directly from '../theme' or '../theme/colors'
 */
export {
  LIGHT_COLORS,
  DARK_COLORS,
  COLORS,
  colors,
  getColors,
} from '../theme/colors';
export { FONT_FAMILY as FONTS } from '../theme/typography';
export { SPACING, RADIUS } from '../theme/spacing';
export { SHADOWS } from '../theme/shadows';
