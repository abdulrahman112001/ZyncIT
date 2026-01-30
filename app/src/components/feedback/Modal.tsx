/**
 * Modal Component
 * Reusable modal/popup with customizable content
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { ICON_SIZES } from '../../constants/icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';
export type ModalPosition = 'center' | 'bottom';

export interface ModalProps {
  /** Modal visibility */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal subtitle */
  subtitle?: string;
  /** Modal size */
  size?: ModalSize;
  /** Modal position */
  position?: ModalPosition;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close on backdrop press */
  closeOnBackdrop?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Custom header */
  header?: React.ReactNode;
  /** Custom footer */
  footer?: React.ReactNode;
  /** Container style */
  style?: ViewStyle;
  /** Content style */
  contentStyle?: ViewStyle;
  /** Enable scroll for content */
  scrollable?: boolean;
  /** Children */
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  isDark = false,
  header,
  footer,
  style,
  contentStyle,
  scrollable = false,
  children,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(
    new Animated.Value(position === 'bottom' ? 100 : 0),
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: position === 'bottom' ? 100 : 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim, position]);

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { maxHeight: SCREEN_HEIGHT * 0.3 };
      case 'md':
        return { maxHeight: SCREEN_HEIGHT * 0.5 };
      case 'lg':
        return { maxHeight: SCREEN_HEIGHT * 0.7 };
      case 'full':
        return { maxHeight: SCREEN_HEIGHT * 0.9 };
      default:
        return { maxHeight: SCREEN_HEIGHT * 0.5 };
    }
  };

  const getPositionStyle = (): ViewStyle => {
    if (position === 'bottom') {
      return {
        justifyContent: 'flex-end',
      };
    }
    return {
      justifyContent: 'center',
    };
  };

  const getModalStyle = (): ViewStyle => {
    if (position === 'bottom') {
      return {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      };
    }
    return {
      borderRadius: RADIUS.lg,
      marginHorizontal: SPACING.lg,
    };
  };

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: { flexGrow: 1 },
      }
    : {};

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[styles.overlay, getPositionStyle(), { opacity: fadeAnim }]}
        >
          <TouchableWithoutFeedback
            onPress={closeOnBackdrop ? onClose : undefined}
          >
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.modalContainer,
              getSizeStyle(),
              getModalStyle(),
              { backgroundColor: colors.surface },
              { transform: [{ translateY: slideAnim }] },
              style,
            ]}
          >
            {/* Header */}
            {(title || header || showCloseButton) && (
              <View
                style={[styles.header, { borderBottomColor: colors.border }]}
              >
                {header || (
                  <View style={styles.headerContent}>
                    <View style={styles.titleContainer}>
                      {title && (
                        <Text style={[styles.title, { color: colors.text }]}>
                          {title}
                        </Text>
                      )}
                      {subtitle && (
                        <Text
                          style={[
                            styles.subtitle,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {subtitle}
                        </Text>
                      )}
                    </View>
                    {showCloseButton && (
                      <TouchableOpacity
                        style={[
                          styles.closeButton,
                          { backgroundColor: colors.surfaceTertiary },
                        ]}
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Icon
                          name="close"
                          size={ICON_SIZES.sm}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Content */}
            <ContentWrapper
              {...contentWrapperProps}
              style={[styles.content, contentStyle]}
            >
              {children}
            </ContentWrapper>

            {/* Footer */}
            {footer && (
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                {footer}
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  titleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default Modal;
