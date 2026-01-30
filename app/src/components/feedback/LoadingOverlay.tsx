/**
 * LoadingOverlay Component
 * Full-screen loading indicator
 */

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { SHADOWS } from '../../theme/shadows';

export interface LoadingOverlayProps {
  /** Visible state */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Dark mode */
  isDark?: boolean;
  /** Transparent background */
  transparent?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  isDark = false,
  transparent = false,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: transparent ? colors.overlay : colors.overlayLight,
          },
        ]}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
            },
            SHADOWS.xl,
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          {message && (
            <Text style={[styles.message, { color: colors.text }]}>
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingVertical: SPACING['2xl'],
    paddingHorizontal: SPACING['3xl'],
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    minWidth: 120,
  },
  message: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
