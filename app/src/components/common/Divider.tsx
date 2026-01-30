/**
 * Divider Component
 * Horizontal or vertical line separator
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps {
  /** Divider orientation */
  orientation?: DividerOrientation;
  /** Divider label */
  label?: string;
  /** Thickness */
  thickness?: number;
  /** Vertical/Horizontal margin */
  spacing?: keyof typeof SPACING | number;
  /** Dark mode */
  isDark?: boolean;
  /** Custom color */
  color?: string;
  /** Custom style */
  style?: ViewStyle;
  /** Label style */
  labelStyle?: TextStyle;
}

const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  thickness = 1,
  spacing = 'lg',
  isDark = false,
  color,
  style,
  labelStyle,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const getSpacing = () => {
    if (typeof spacing === 'number') return spacing;
    return SPACING[spacing];
  };

  const dividerColor = color || colors.border;
  const spacingValue = getSpacing();

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            width: thickness,
            backgroundColor: dividerColor,
            marginHorizontal: spacingValue,
          },
          style,
        ]}
      />
    );
  }

  // Horizontal with label
  if (label) {
    return (
      <View
        style={[styles.labelContainer, { marginVertical: spacingValue }, style]}
      >
        <View
          style={[
            styles.line,
            {
              height: thickness,
              backgroundColor: dividerColor,
            },
          ]}
        />
        <Text
          style={[styles.label, { color: colors.textSecondary }, labelStyle]}
        >
          {label}
        </Text>
        <View
          style={[
            styles.line,
            {
              height: thickness,
              backgroundColor: dividerColor,
            },
          ]}
        />
      </View>
    );
  }

  // Simple horizontal
  return (
    <View
      style={[
        styles.horizontal,
        {
          height: thickness,
          backgroundColor: dividerColor,
          marginVertical: spacingValue,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.caption,
    marginHorizontal: SPACING.md,
  },
});

export default Divider;
