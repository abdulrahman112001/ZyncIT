/**
 * AnimatedListItem Component
 * Wraps FlatList items with staggered fade+slide entry animation
 */

import React, { useRef, useEffect, memo } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { ANIMATION_CONFIGS, STAGGER } from '../../theme/animations';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  speed?: keyof typeof STAGGER;
  style?: ViewStyle;
}

const AnimatedListItem: React.FC<AnimatedListItemProps> = memo(
  ({ children, index, speed = 'normal', style }) => {
    const progress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const clampedIndex = Math.min(index, 8);
      const delay = clampedIndex * STAGGER[speed];

      const animation = Animated.timing(progress, {
        toValue: 1,
        ...ANIMATION_CONFIGS.listItem,
        delay,
      });
      animation.start();

      return () => animation.stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const animatedStyle: Animated.WithAnimatedObject<ViewStyle> = {
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [12, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    );
  },
);

AnimatedListItem.displayName = 'AnimatedListItem';

export default AnimatedListItem;
