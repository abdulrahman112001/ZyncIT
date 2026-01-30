/**
 * Header Component
 * Screen header with navigation and actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, COMPONENT_SPACING, RADIUS } from '../../theme/spacing';
import { SHADOWS } from '../../theme/shadows';
import { ICONS, ICON_SIZES } from '../../constants/icons';

export interface HeaderAction {
  icon: string;
  onPress: () => void;
  badge?: number;
}

export interface HeaderProps {
  /** Header title */
  title?: string;
  /** Subtitle */
  subtitle?: string;
  /** Show back button */
  showBack?: boolean;
  /** Back button callback */
  onBack?: () => void;
  /** Right actions */
  actions?: HeaderAction[];
  /** Left custom component */
  leftComponent?: React.ReactNode;
  /** Right custom component */
  rightComponent?: React.ReactNode;
  /** Center custom component */
  centerComponent?: React.ReactNode;
  /** Transparent background */
  transparent?: boolean;
  /** Show shadow */
  elevated?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** RTL layout */
  isRTL?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Title style */
  titleStyle?: TextStyle;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions = [],
  leftComponent,
  rightComponent,
  centerComponent,
  transparent = false,
  elevated = false,
  isDark = false,
  isRTL = false,
  style,
  titleStyle,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const renderBackButton = () => {
    if (!showBack) return null;

    return (
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
      >
        <Icon
          name={isRTL ? ICONS.forward : ICONS.back}
          size={ICON_SIZES.lg}
          color={colors.text}
        />
      </TouchableOpacity>
    );
  };

  const renderActions = () => {
    if (rightComponent) return rightComponent;
    if (actions.length === 0) return <View style={styles.placeholder} />;

    return (
      <View style={[styles.actions, isRTL && styles.actionsRTL]}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionButton}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <Icon name={action.icon} size={ICON_SIZES.md} color={colors.text} />
            {action.badge !== undefined && action.badge > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>
                  {action.badge > 99 ? '99+' : action.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderLeft = () => {
    if (leftComponent) return leftComponent;
    if (showBack) return renderBackButton();
    return <View style={styles.placeholder} />;
  };

  const renderCenter = () => {
    if (centerComponent) return centerComponent;

    return (
      <View style={styles.titleContainer}>
        {title && (
          <Text
            style={[styles.title, { color: colors.text }, titleStyle]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: transparent ? 'transparent' : colors.surface,
        },
        elevated && SHADOWS.sm,
        isRTL && styles.containerRTL,
        style,
      ]}
    >
      {renderLeft()}
      {renderCenter()}
      {renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: COMPONENT_SPACING.header.height,
    paddingHorizontal: COMPONENT_SPACING.header.paddingHorizontal,
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -SPACING.sm,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h5,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRTL: {
    flexDirection: 'row-reverse',
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...TYPOGRAPHY.captionSmall,
    color: '#FFF',
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
});

export default Header;
