/**
 * BottomSheet Component
 * Modal sheet that slides up from the bottom
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  PanResponder,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { SHADOWS } from '../../theme/shadows';
import { DURATION, EASING } from '../../theme/animations';
import { ICONS, ICON_SIZES } from '../../constants/icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  /** Visible state */
  visible: boolean;
  /** On close callback */
  onClose: () => void;
  /** Sheet title */
  title?: string;
  /** Sheet content */
  children: React.ReactNode;
  /** Sheet height (percentage of screen) */
  height?: number;
  /** Show drag handle */
  showHandle?: boolean;
  /** Show close button */
  showClose?: boolean;
  /** Close on backdrop press */
  closeOnBackdrop?: boolean;
  /** Enable drag to close */
  dragToClose?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  height = 0.5,
  showHandle = true,
  showClose = true,
  closeOnBackdrop = true,
  dragToClose = true,
  isDark = false,
  style,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const sheetHeight = SCREEN_HEIGHT * height;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: DURATION.normal,
          easing: EASING.decelerate,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: DURATION.normal,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: DURATION.quick,
          easing: EASING.accelerate,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: DURATION.quick,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: DURATION.quick,
        easing: EASING.accelerate,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: DURATION.quick,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => dragToClose,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return dragToClose && gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > sheetHeight * 0.3 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableWithoutFeedback
          onPress={closeOnBackdrop ? handleClose : undefined}
        >
          <Animated.View
            style={[
              styles.backdrop,
              {
                backgroundColor: colors.overlay,
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: colors.surface,
              transform: [{ translateY }],
            },
            SHADOWS['2xl'],
            style,
          ]}
          {...panResponder.panHandlers}
        >
          {/* Handle */}
          {showHandle && (
            <View style={styles.handleContainer}>
              <View
                style={[styles.handle, { backgroundColor: colors.border }]}
              />
            </View>
          )}

          {/* Header */}
          {(title || showClose) && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {title || ''}
              </Text>
              {showClose && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Icon
                    name={ICONS.close}
                    size={ICON_SIZES.md}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.full,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h5,
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -SPACING.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
});

export default BottomSheet;
