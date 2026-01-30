/**
 * SwipeableRow Component
 * Swipeable row for delete/edit actions
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { ICON_SIZES } from '../../constants/icons';

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 80;

export interface SwipeAction {
  /** Action icon */
  icon: string;
  /** Action label */
  label?: string;
  /** Action color */
  color: string;
  /** Action background color */
  backgroundColor: string;
  /** Action handler */
  onPress: () => void;
}

export interface SwipeableRowProps {
  /** Left swipe actions */
  leftActions?: SwipeAction[];
  /** Right swipe actions */
  rightActions?: SwipeAction[];
  /** Dark mode */
  isDark?: boolean;
  /** Container style */
  style?: ViewStyle;
  /** Children */
  children: React.ReactNode;
  /** Callback when row is opened */
  onOpen?: (direction: 'left' | 'right') => void;
  /** Callback when row is closed */
  onClose?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({
  leftActions = [],
  rightActions = [],
  isDark = false,
  style,
  children,
  onOpen,
  onClose,
  disabled = false,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const currentDirection = useRef<'left' | 'right' | null>(null);

  const leftActionsWidth = leftActions.length * ACTION_WIDTH;
  const rightActionsWidth = rightActions.length * ACTION_WIDTH;

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start(() => {
      isOpen.current = false;
      currentDirection.current = null;
      onClose?.();
    });
  };

  const openLeft = () => {
    Animated.spring(translateX, {
      toValue: leftActionsWidth,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start(() => {
      isOpen.current = true;
      currentDirection.current = 'left';
      onOpen?.('left');
    });
  };

  const openRight = () => {
    Animated.spring(translateX, {
      toValue: -rightActionsWidth,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start(() => {
      isOpen.current = true;
      currentDirection.current = 'right';
      onOpen?.('right');
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (disabled) return false;
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(
          isOpen.current
            ? currentDirection.current === 'left'
              ? leftActionsWidth
              : -rightActionsWidth
            : 0,
        );
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx } = gestureState;

        // Limit swipe range
        let newValue = dx;
        if (dx > 0 && leftActions.length === 0) {
          newValue = 0;
        } else if (dx < 0 && rightActions.length === 0) {
          newValue = 0;
        } else if (dx > leftActionsWidth + 20) {
          newValue = leftActionsWidth + 20;
        } else if (dx < -(rightActionsWidth + 20)) {
          newValue = -(rightActionsWidth + 20);
        }

        translateX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();
        const { dx, vx } = gestureState;

        // Determine final position based on velocity and position
        if (dx > 0 && leftActions.length > 0) {
          if (dx > SWIPE_THRESHOLD || vx > 0.5) {
            openLeft();
          } else {
            resetPosition();
          }
        } else if (dx < 0 && rightActions.length > 0) {
          if (dx < -SWIPE_THRESHOLD || vx < -0.5) {
            openRight();
          } else {
            resetPosition();
          }
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  const handleActionPress = (action: SwipeAction) => {
    resetPosition();
    action.onPress();
  };

  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (actions.length === 0) return null;

    return (
      <View
        style={[
          styles.actionsContainer,
          side === 'left' ? styles.leftActions : styles.rightActions,
        ]}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.actionButton,
              { backgroundColor: action.backgroundColor },
            ]}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.8}
          >
            <Icon
              name={action.icon}
              size={ICON_SIZES.md}
              color={action.color}
            />
            {action.label && (
              <Text style={[styles.actionLabel, { color: action.color }]}>
                {action.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Left Actions */}
      {renderActions(leftActions, 'left')}

      {/* Right Actions */}
      {renderActions(rightActions, 'right')}

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          { backgroundColor: colors.surface },
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    width: '100%',
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftActions: {
    left: 0,
  },
  rightActions: {
    right: 0,
  },
  actionButton: {
    width: ACTION_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  actionLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default SwipeableRow;
