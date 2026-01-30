/**
 * Avatar Component
 * User avatar with image or initials fallback
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY, FONT_SIZES } from '../../theme/typography';
import { COMPONENT_SPACING } from '../../theme/spacing';
import { ICONS } from '../../constants/icons';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  /** Image source */
  source?: ImageSourcePropType | string;
  /** User name for initials fallback */
  name?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Show online status indicator */
  showStatus?: boolean;
  /** Online status */
  isOnline?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom style */
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  showStatus = false,
  isOnline = false,
  isDark = false,
  backgroundColor,
  style,
}) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const [imageError, setImageError] = useState(false);

  const getSize = () => COMPONENT_SPACING.avatar[size];
  const avatarSize = getSize();

  const getFontSize = (): number => {
    switch (size) {
      case 'xs':
        return FONT_SIZES.xs;
      case 'sm':
        return FONT_SIZES.sm;
      case 'md':
        return FONT_SIZES.md;
      case 'lg':
        return FONT_SIZES.lg;
      case 'xl':
        return FONT_SIZES.xl;
      case '2xl':
        return FONT_SIZES['2xl'];
      default:
        return FONT_SIZES.md;
    }
  };

  const getStatusSize = () => {
    switch (size) {
      case 'xs':
      case 'sm':
        return 8;
      case 'md':
        return 10;
      case 'lg':
        return 12;
      case 'xl':
      case '2xl':
        return 14;
      default:
        return 10;
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getBackgroundColor = () => {
    if (backgroundColor) return backgroundColor;
    // Generate consistent color based on name
    if (name) {
      const colorOptions = [
        colors.primary,
        colors.secondary,
        colors.info,
        colors.warning,
      ];
      const index = name.charCodeAt(0) % colorOptions.length;
      return colorOptions[index];
    }
    return colors.surfaceSecondary;
  };

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: getBackgroundColor(),
  };

  const imageSource = typeof source === 'string' ? { uri: source } : source;

  const showImage = source && !imageError;
  const showInitials = !showImage && name;
  const showIcon = !showImage && !name;

  return (
    <View style={[styles.container, containerStyle, style]}>
      {showImage && (
        <Image
          source={imageSource!}
          style={[styles.image, { borderRadius: avatarSize / 2 }]}
          onError={() => setImageError(true)}
        />
      )}

      {showInitials && (
        <Text
          style={[
            styles.initials,
            { fontSize: getFontSize(), color: colors.white },
          ]}
        >
          {getInitials(name!)}
        </Text>
      )}

      {showIcon && (
        <Icon
          name={ICONS.personOutline}
          size={avatarSize * 0.5}
          color={colors.textTertiary}
        />
      )}

      {showStatus && (
        <View
          style={[
            styles.status,
            {
              width: getStatusSize(),
              height: getStatusSize(),
              borderRadius: getStatusSize() / 2,
              backgroundColor: isOnline ? colors.success : colors.textTertiary,
              borderColor: colors.surface,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    ...TYPOGRAPHY.label,
    color: '#FFF',
  },
  status: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
});

export default Avatar;
