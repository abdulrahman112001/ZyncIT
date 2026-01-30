/**
 * Skeleton Component
 * Loading placeholder with shimmer animation
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { RADIUS } from '../../theme/spacing';
import { DURATION } from '../../theme/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

export interface SkeletonProps {
  /** Skeleton variant */
  variant?: SkeletonVariant;
  /** Width (number or percentage string) */
  width?: number | string;
  /** Height */
  height?: number;
  /** Border radius (for rectangular variant) */
  borderRadius?: number;
  /** Enable shimmer animation */
  animated?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  borderRadius,
  animated = true,
  isDark = false,
  style,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: DURATION.slowest,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: DURATION.slowest,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }
  }, [animated, shimmerAnim]);

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'text':
        return {
          width: width as any,
          height: height || 16,
          borderRadius: RADIUS.sm,
        };
      case 'circular':
        const size = typeof width === 'number' ? width : 40;
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      case 'rectangular':
        return {
          width: width as any,
          height: height || 100,
          borderRadius: borderRadius || 0,
        };
      case 'rounded':
        return {
          width: width as any,
          height: height || 100,
          borderRadius: borderRadius || RADIUS.lg,
        };
      default:
        return {
          width: width as any,
          height: height || 16,
          borderRadius: RADIUS.sm,
        };
    }
  };

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View
      style={[
        styles.container,
        getVariantStyles(),
        { backgroundColor: colors.skeleton },
        style,
      ]}
    >
      {animated && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              backgroundColor: colors.skeletonHighlight,
              transform: [{ translateX }],
              opacity,
            },
          ]}
        />
      )}
    </View>
  );
};

// Skeleton Group for common patterns
export interface SkeletonGroupProps {
  /** Number of skeleton items */
  count?: number;
  /** Gap between items */
  gap?: number;
  /** Children */
  children?: React.ReactNode;
  /** Dark mode */
  isDark?: boolean;
  /** Style */
  style?: ViewStyle;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  count = 3,
  gap = 12,
  children,
  isDark = false,
  style,
}) => {
  if (children) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          isDark={isDark}
          style={{ marginBottom: index < count - 1 ? gap : 0 }}
        />
      ))}
    </View>
  );
};

// Common skeleton patterns
export const SkeletonCard: React.FC<{ isDark?: boolean }> = ({
  isDark = false,
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Skeleton variant="circular" width={48} isDark={isDark} />
      <View style={styles.cardHeaderText}>
        <Skeleton width="60%" height={16} isDark={isDark} />
        <Skeleton
          width="40%"
          height={12}
          isDark={isDark}
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
    <Skeleton
      variant="rounded"
      height={120}
      isDark={isDark}
      style={{ marginTop: 12 }}
    />
    <Skeleton
      width="80%"
      height={14}
      isDark={isDark}
      style={{ marginTop: 12 }}
    />
    <Skeleton
      width="60%"
      height={14}
      isDark={isDark}
      style={{ marginTop: 8 }}
    />
  </View>
);

export const SkeletonListItem: React.FC<{ isDark?: boolean }> = ({
  isDark = false,
}) => (
  <View style={styles.listItem}>
    <Skeleton variant="circular" width={44} isDark={isDark} />
    <View style={styles.listItemContent}>
      <Skeleton width="70%" height={16} isDark={isDark} />
      <Skeleton
        width="50%"
        height={12}
        isDark={isDark}
        style={{ marginTop: 6 }}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
});

export default Skeleton;
