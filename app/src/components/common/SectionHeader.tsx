/**
 * SectionHeader Component
 * Unified section header with title and optional action
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { ICON_SIZES } from '../../constants/icons';

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Action text (e.g., "See All") */
  actionText?: string;
  /** Action icon */
  actionIcon?: string;
  /** Action handler */
  onAction?: () => void;
  /** Dark mode */
  isDark?: boolean;
  /** Show top padding */
  showTopPadding?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Title style */
  titleStyle?: TextStyle;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  actionIcon = 'chevron-forward',
  onAction,
  isDark = false,
  showTopPadding = true,
  style,
  titleStyle,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <View
      style={[styles.container, showTopPadding && styles.topPadding, style]}
    >
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }, titleStyle]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {(actionText || onAction) && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.7}
        >
          {actionText && (
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {actionText}
            </Text>
          )}
          {actionIcon && onAction && (
            <Icon
              name={actionIcon}
              size={ICON_SIZES.sm}
              color={colors.primary}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  topPadding: {
    paddingTop: SPACING.lg,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingLeft: SPACING.sm,
  },
  actionText: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
});

export default SectionHeader;
