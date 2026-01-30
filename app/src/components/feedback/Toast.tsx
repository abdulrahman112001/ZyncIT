/**
 * Toast Component
 * In-app notification messages
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { SHADOWS } from '../../theme/shadows';
import { DURATION, EASING } from '../../theme/animations';
import { ICONS, ICON_SIZES } from '../../constants/icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'bottom';

export interface ToastProps {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: ToastType;
  /** Toast title */
  title?: string;
  /** Auto-hide duration (ms), 0 to disable */
  duration?: number;
  /** Position on screen */
  position?: ToastPosition;
  /** Show close button */
  showClose?: boolean;
  /** On close callback */
  onClose?: () => void;
  /** Visible state */
  visible: boolean;
  /** Dark mode */
  isDark?: boolean;
}

const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  title,
  duration = 4000,
  position = 'top',
  showClose = true,
  onClose,
  visible,
  isDark = false,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const translateY = useRef(
    new Animated.Value(position === 'top' ? -100 : 100),
  ).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: DURATION.normal,
          easing: EASING.decelerate,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: DURATION.normal,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      translateY.setValue(position === 'top' ? -100 : 100);
      opacity.setValue(0);
    }
  }, [visible, duration, position]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -100 : 100,
        duration: DURATION.quick,
        easing: EASING.accelerate,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: DURATION.quick,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: ICONS.successOutline,
          backgroundColor: colors.successLight,
          iconColor: colors.success,
          borderColor: colors.success,
        };
      case 'error':
        return {
          icon: ICONS.errorOutline,
          backgroundColor: colors.errorLight,
          iconColor: colors.error,
          borderColor: colors.error,
        };
      case 'warning':
        return {
          icon: ICONS.warningOutline,
          backgroundColor: colors.warningLight,
          iconColor: colors.warning,
          borderColor: colors.warning,
        };
      case 'info':
      default:
        return {
          icon: ICONS.infoOutline,
          backgroundColor: colors.infoLight,
          iconColor: colors.info,
          borderColor: colors.info,
        };
    }
  };

  const config = getTypeConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderLeftColor: config.borderColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: config.backgroundColor },
        ]}
      >
        <Icon
          name={config.icon}
          size={ICON_SIZES.md}
          color={config.iconColor}
        />
      </View>

      <View style={styles.content}>
        {title && (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        )}
        <Text
          style={[
            styles.message,
            { color: isDark ? '#94A3B8' : '#64748B' },
            !title && styles.messageOnly,
          ]}
          numberOfLines={3}
        >
          {message}
        </Text>
      </View>

      {showClose && (
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Icon
            name={ICONS.close}
            size={ICON_SIZES.sm}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageOnly: {
    fontSize: 15,
  },
  closeButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
});

export default Toast;
