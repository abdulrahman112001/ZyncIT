/**
 * Input Component
 * Reusable text input with validation support
 */

import React, { useState, forwardRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY, FONT_SIZES } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { ICONS, ICON_SIZES } from '../../constants/icons';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Left icon name */
  leftIcon?: string;
  /** Right icon name */
  rightIcon?: string;
  /** Input size */
  size?: InputSize;
  /** Disabled state */
  disabled?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Show password toggle for secure text */
  showPasswordToggle?: boolean;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Input style */
  inputStyle?: TextStyle;
  /** Label style */
  labelStyle?: TextStyle;
  /** On right icon press */
  onRightIconPress?: () => void;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      size = 'md',
      disabled = false,
      required = false,
      isDark = false,
      showPasswordToggle = false,
      secureTextEntry,
      containerStyle,
      inputStyle,
      labelStyle,
      onRightIconPress,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    const handleFocus = useCallback(
      (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      [onBlur],
    );

    const toggleSecure = useCallback(() => {
      setIsSecure(!isSecure);
    }, [isSecure]);

    const getSizeStyles = useCallback((): {
      container: ViewStyle;
      input: TextStyle;
      iconSize: number;
    } => {
      switch (size) {
        case 'sm':
          return {
            container: {
              paddingVertical: SPACING.sm,
              paddingHorizontal: SPACING.md,
              borderRadius: RADIUS.md,
            },
            input: {
              fontSize: FONT_SIZES.md,
            },
            iconSize: ICON_SIZES.sm,
          };
        case 'lg':
          return {
            container: {
              paddingVertical: SPACING.lg,
              paddingHorizontal: SPACING.xl,
              borderRadius: RADIUS.xl,
            },
            input: {
              fontSize: FONT_SIZES.lg,
            },
            iconSize: ICON_SIZES.lg,
          };
        case 'md':
        default:
          return {
            container: {
              paddingVertical: SPACING.md,
              paddingHorizontal: SPACING.lg,
              borderRadius: RADIUS.lg,
            },
            input: {
              fontSize: FONT_SIZES.base,
            },
            iconSize: ICON_SIZES.md,
          };
      }
    }, [size]);

    const sizeStyles = getSizeStyles();

    const getBorderColor = () => {
      if (error) return colors.error;
      if (isFocused) return colors.primary;
      return colors.inputBorder;
    };

    const getBackgroundColor = () => {
      if (disabled) return colors.inputDisabled;
      return colors.inputBackground;
    };

    const showRightIcon = showPasswordToggle || rightIcon;
    const rightIconName = showPasswordToggle
      ? isSecure
        ? ICONS.eyeOff
        : ICONS.eye
      : rightIcon;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text }, labelStyle]}>
              {label}
              {required && <Text style={{ color: colors.error }}> *</Text>}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputContainer,
            sizeStyles.container,
            {
              backgroundColor: getBackgroundColor(),
              borderColor: getBorderColor(),
            },
          ]}
        >
          {leftIcon && (
            <Icon
              name={leftIcon}
              size={sizeStyles.iconSize}
              color={isFocused ? colors.primary : colors.textTertiary}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              sizeStyles.input,
              { color: colors.text },
              leftIcon && styles.inputWithLeftIcon,
              showRightIcon && styles.inputWithRightIcon,
              inputStyle,
            ]}
            placeholderTextColor={colors.inputPlaceholder}
            editable={!disabled}
            secureTextEntry={isSecure}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {showRightIcon && (
            <TouchableOpacity
              onPress={showPasswordToggle ? toggleSecure : onRightIconPress}
              disabled={!showPasswordToggle && !onRightIconPress}
              style={styles.rightIconButton}
            >
              <Icon
                name={rightIconName!}
                size={sizeStyles.iconSize}
                color={colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {(helperText || error) && (
          <Text
            style={[
              styles.helperText,
              { color: error ? colors.error : colors.textSecondary },
            ]}
          >
            {error || helperText}
          </Text>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    marginBottom: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.label,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    height: 56,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    height: '100%',
  },
  inputWithLeftIcon: {
    marginLeft: SPACING.sm,
  },
  inputWithRightIcon: {
    marginRight: SPACING.sm,
  },
  leftIcon: {
    marginRight: SPACING.xs,
  },
  rightIconButton: {
    padding: SPACING.xs,
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});

Input.displayName = 'Input';

export default Input;
