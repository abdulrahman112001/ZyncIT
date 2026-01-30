import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EmptyStateProps } from './types';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { ICON_SIZES } from '../../constants/icons';

/**
 * A reusable empty state component for lists
 * Used in: NotificationsScreen, CallsScreen, SMSScreen, etc.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconComponent,
  title,
  subtitle,
  actionButton,
  isLoading = false,
  loadingText,
  isDarkMode = false,
}) => {
  const colors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const textColor = colors.text;
  const secondaryTextColor = colors.textSecondary;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        {loadingText && (
          <Text style={[styles.title, { color: textColor, marginTop: 16 }]}>
            {loadingText}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {iconComponent ? (
        iconComponent
      ) : icon ? (
        typeof icon === 'string' && icon.length <= 2 ? (
          // Emoji
          <Text style={styles.emoji}>{icon}</Text>
        ) : (
          // Ionicon name
          <Ionicons
            name={icon}
            size={ICON_SIZES['3xl']}
            color={secondaryTextColor}
            style={styles.icon}
          />
        )
      ) : null}

      <Text style={[styles.title, { color: textColor }]}>{title}</Text>

      {subtitle && (
        <Text style={[styles.subtitle, { color: secondaryTextColor }]}>
          {subtitle}
        </Text>
      )}

      {actionButton && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={actionButton.onPress}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{actionButton.text}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING['3xl'],
  },
  icon: {
    marginBottom: SPACING.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xl,
  },
  buttonText: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
});

export default EmptyState;
