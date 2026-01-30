/**
 * ConfirmDialog Component
 * Yes/No confirmation dialog
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Modal from './Modal';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { ICON_SIZES } from '../../constants/icons';

export type ConfirmDialogType = 'info' | 'warning' | 'danger' | 'success';

export interface ConfirmDialogProps {
  /** Dialog visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message */
  message?: string;
  /** Dialog type */
  type?: ConfirmDialogType;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Loading state */
  loading?: boolean;
  /** Custom icon */
  icon?: string;
  /** Dark mode */
  isDark?: boolean;
  /** Hide cancel button */
  hideCancelButton?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  loading = false,
  icon,
  isDark = false,
  hideCancelButton = false,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: icon || 'alert-circle',
          color: colors.error,
          bgColor: `${colors.error}15`,
        };
      case 'warning':
        return {
          icon: icon || 'warning',
          color: colors.warning,
          bgColor: `${colors.warning}15`,
        };
      case 'success':
        return {
          icon: icon || 'checkmark-circle',
          color: colors.success,
          bgColor: `${colors.success}15`,
        };
      case 'info':
      default:
        return {
          icon: icon || 'information-circle',
          color: colors.primary,
          bgColor: `${colors.primary}15`,
        };
    }
  };

  const typeConfig = getTypeConfig();

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return { backgroundColor: colors.error };
      case 'warning':
        return { backgroundColor: colors.warning };
      case 'success':
        return { backgroundColor: colors.success };
      case 'info':
      default:
        return { backgroundColor: colors.primary };
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      size="sm"
      position="center"
      showCloseButton={false}
      closeOnBackdrop={!loading}
      isDark={isDark}
      contentStyle={styles.content}
    >
      {/* Icon */}
      <View
        style={[styles.iconContainer, { backgroundColor: typeConfig.bgColor }]}
      >
        <Icon
          name={typeConfig.icon}
          size={ICON_SIZES.xl}
          color={typeConfig.color}
        />
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {/* Message */}
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {!hideCancelButton && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.cancelButton,
              { backgroundColor: colors.surfaceTertiary },
            ]}
            onPress={onClose}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>
              {cancelText}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            getConfirmButtonStyle(),
            hideCancelButton && styles.fullWidthButton,
          ]}
          onPress={onConfirm}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.buttonText, styles.confirmButtonText]}>
              {confirmText}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {},
  confirmButton: {},
  fullWidthButton: {
    flex: 1,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
});

export default ConfirmDialog;
