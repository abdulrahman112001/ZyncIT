/**
 * Badge Component
 * Small status indicator or counter
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY, FONT_SIZES } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { ICON_SIZES } from '../../constants/icons';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge content (text or number) */
  content?: string | number;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Icon name (Ionicons) */
  icon?: string;
  /** Dot only (no content) */
  dot?: boolean;
  /** Max count to display (shows 99+ for larger numbers) */
  maxCount?: number;
  /** Dark mode */
  isDark?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
}

const Badge: React.FC<BadgeProps> = ({
  content,
  variant = 'primary',
  size = 'md',
  icon,
  dot = false,
  maxCount = 99,
  isDark = false,
  style,
  textStyle,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primary, text: colors.white };
      case 'secondary':
        return { bg: colors.secondary, text: colors.white };
      case 'success':
        return { bg: colors.success, text: colors.white };
      case 'warning':
        return { bg: colors.warning, text: colors.black };
      case 'error':
        return { bg: colors.error, text: colors.white };
      case 'info':
        return { bg: colors.info, text: colors.white };
      default:
        return { bg: colors.primary, text: colors.white };
    }
  };

  const getSizeStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    iconSize: number;
    dotSize: number;
  } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingHorizontal: SPACING.xs,
            paddingVertical: SPACING['2xs'],
            minWidth: 16,
            height: 16,
            borderRadius: RADIUS.sm,
          },
          text: {
            fontSize: FONT_SIZES.xs,
          },
          iconSize: ICON_SIZES.xs,
          dotSize: 8,
        };
      case 'lg':
        return {
          container: {
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs,
            minWidth: 28,
            height: 28,
            borderRadius: RADIUS.lg,
          },
          text: {
            fontSize: FONT_SIZES.md,
          },
          iconSize: ICON_SIZES.md,
          dotSize: 14,
        };
      case 'md':
      default:
        return {
          container: {
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING['2xs'],
            minWidth: 22,
            height: 22,
            borderRadius: RADIUS.md,
          },
          text: {
            fontSize: FONT_SIZES.sm,
          },
          iconSize: ICON_SIZES.sm,
          dotSize: 10,
        };
    }
  };

  const variantColors = getVariantColors();
  const sizeStyles = getSizeStyles();

  const getDisplayContent = () => {
    if (typeof content === 'number' && content > maxCount) {
      return `${maxCount}+`;
    }
    return String(content);
  };

  // Dot variant
  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: variantColors.bg,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: variantColors.bg },
        style,
      ]}
    >
      {icon ? (
        <Icon
          name={icon}
          size={sizeStyles.iconSize}
          color={variantColors.text}
        />
      ) : content !== undefined ? (
        <Text
          style={[
            styles.text,
            sizeStyles.text,
            { color: variantColors.text },
            textStyle,
          ]}
        >
          {getDisplayContent()}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  dot: {},
  text: {
    ...TYPOGRAPHY.labelSmall,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Badge;
