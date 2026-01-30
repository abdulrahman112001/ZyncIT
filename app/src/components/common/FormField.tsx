/**
 * FormField Component
 * Form field wrapper with label, input, and error message
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Required field indicator */
  required?: boolean;
  /** Error message */
  error?: string;
  /** Helper text (shown when no error) */
  helperText?: string;
  /** Dark mode */
  isDark?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Label style */
  labelStyle?: TextStyle;
  /** Children (input component) */
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helperText,
  isDark = false,
  style,
  labelStyle,
  children,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }, labelStyle]}>
            {label}
          </Text>
          {required && (
            <Text style={[styles.required, { color: colors.error }]}>
              {' *'}
            </Text>
          )}
        </View>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>{children}</View>

      {/* Error or Helper Text */}
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? colors.error : colors.textSecondary,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontWeight: '500',
  },
  required: {
    ...TYPOGRAPHY.label,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.xs,
  },
});

export default FormField;
