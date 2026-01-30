/**
 * ListItem Component
 * Unified list item with icon, title, subtitle, and action
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { ICON_SIZES } from '../../constants/icons';

export interface ListItemProps {
  /** Main title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Left icon name (Ionicons) */
  leftIcon?: string;
  /** Right icon name (Ionicons) - defaults to chevron-forward */
  rightIcon?: string;
  /** Custom left component */
  leftComponent?: React.ReactNode;
  /** Custom right component */
  rightComponent?: React.ReactNode;
  /** Show chevron arrow */
  showChevron?: boolean;
  /** On press handler */
  onPress?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Show bottom border */
  showBorder?: boolean;
  /** Left icon color */
  iconColor?: string;
  /** Left icon background color */
  iconBgColor?: string;
  /** Container style */
  style?: ViewStyle;
  /** Title style */
  titleStyle?: TextStyle;
  /** Subtitle style */
  subtitleStyle?: TextStyle;
}

const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  leftComponent,
  rightComponent,
  showChevron = true,
  onPress,
  disabled = false,
  isDark = false,
  showBorder = true,
  iconColor,
  iconBgColor,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const containerStyle: ViewStyle = {
    ...styles.container,
    backgroundColor: colors.surface,
    borderBottomColor: showBorder ? colors.border : 'transparent',
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const content = (
    <>
      {/* Left Section */}
      {(leftIcon || leftComponent) && (
        <View style={styles.leftSection}>
          {leftComponent || (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: iconBgColor || colors.primaryLight,
                },
              ]}
            >
              <Icon
                name={leftIcon!}
                size={ICON_SIZES.md}
                color={iconColor || colors.primary}
              />
            </View>
          )}
        </View>
      )}

      {/* Content Section */}
      <View style={styles.contentSection}>
        <Text
          style={[styles.title, { color: colors.text }, titleStyle]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
              subtitleStyle,
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {rightComponent || (
          <>
            {rightIcon && (
              <Icon
                name={rightIcon}
                size={ICON_SIZES.sm}
                color={colors.textSecondary}
              />
            )}
            {showChevron && !rightIcon && onPress && (
              <Icon
                name="chevron-forward"
                size={ICON_SIZES.sm}
                color={colors.textSecondary}
              />
            )}
          </>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    marginRight: SPACING.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  rightSection: {
    marginLeft: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ListItem;
