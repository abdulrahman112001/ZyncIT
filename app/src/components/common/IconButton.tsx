/**
 * IconButton Component
 * Circular button with icon
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TouchableOpacityProps,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';
import { SHADOWS } from '../../theme/shadows';
import { ICON_SIZES } from '../../constants/icons';

export type IconButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Icon name (Ionicons) */
  icon: string;
  /** Button variant */
  variant?: IconButtonVariant;
  /** Button size */
  size?: IconButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Custom icon color */
  iconColor?: string;
  /** Custom style */
  style?: ViewStyle;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  isDark = false,
  iconColor,
  style,
  onPress,
  ...props
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const getSizeStyles = (): {
    container: ViewStyle;
    iconSize: number;
  } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            width: 32,
            height: 32,
            borderRadius: RADIUS.md,
          },
          iconSize: ICON_SIZES.sm,
        };
      case 'lg':
        return {
          container: {
            width: 52,
            height: 52,
            borderRadius: RADIUS.xl,
          },
          iconSize: ICON_SIZES.lg,
        };
      case 'md':
      default:
        return {
          container: {
            width: 44,
            height: 44,
            borderRadius: RADIUS.lg,
          },
          iconSize: ICON_SIZES.md,
        };
    }
  };

  const getVariantStyles = (): {
    container: ViewStyle;
    iconColor: string;
  } => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isDisabled ? colors.border : colors.primary,
            ...SHADOWS.sm,
          },
          iconColor: isDisabled ? colors.textTertiary : colors.white,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDisabled ? colors.border : colors.secondary,
            ...SHADOWS.sm,
          },
          iconColor: isDisabled ? colors.textTertiary : colors.white,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: isDisabled ? colors.border : colors.primary,
          },
          iconColor: isDisabled ? colors.textTertiary : colors.primary,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          iconColor: isDisabled ? colors.textTertiary : colors.text,
        };
      case 'danger':
        return {
          container: {
            backgroundColor: isDisabled ? colors.border : colors.error,
            ...SHADOWS.sm,
          },
          iconColor: isDisabled ? colors.textTertiary : colors.white,
        };
      default:
        return {
          container: {},
          iconColor: colors.text,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.iconColor} />
      ) : (
        <Icon
          name={icon}
          size={sizeStyles.iconSize}
          color={iconColor || variantStyles.iconColor}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
