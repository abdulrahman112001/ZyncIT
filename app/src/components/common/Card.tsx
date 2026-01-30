/**
 * Card Component
 * Reusable card container with various styles
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { SPACING, RADIUS } from '../../theme/spacing';
import { SHADOWS } from '../../theme/shadows';

export type CardVariant = 'elevated' | 'outlined' | 'filled';

export interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Card content */
  children: React.ReactNode;
  /** Card variant */
  variant?: CardVariant;
  /** Card padding */
  padding?: keyof typeof SPACING | number;
  /** Border radius */
  borderRadius?: keyof typeof RADIUS | number;
  /** Dark mode */
  isDark?: boolean;
  /** Pressable card */
  pressable?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'lg',
  borderRadius = 'xl',
  isDark = false,
  pressable = false,
  style,
  onPress,
  ...props
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const getPadding = () => {
    if (typeof padding === 'number') return padding;
    return SPACING[padding];
  };

  const getBorderRadius = () => {
    if (typeof borderRadius === 'number') return borderRadius;
    return RADIUS[borderRadius];
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.card,
          ...SHADOWS.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surfaceSecondary,
        };
      default:
        return {};
    }
  };

  const cardStyle: ViewStyle = {
    padding: getPadding(),
    borderRadius: getBorderRadius(),
    ...getVariantStyles(),
  };

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, cardStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});

export default Card;
