import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ScreenTitleProps } from './types';

interface ExtendedScreenTitleProps extends ScreenTitleProps {
  // For select mode delete button
  isSelectMode?: boolean;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  isRTL?: boolean;
}

/**
 * A reusable screen title component with optional delete action
 * Used in: NotificationsScreen, CallsScreen, SMSScreen, etc.
 */
const ScreenTitle: React.FC<ExtendedScreenTitleProps> = ({
  title,
  isDarkMode = false,
  rightComponent,
  containerStyle,
  titleStyle,
  isSelectMode = false,
  selectedCount = 0,
  onDeleteSelected,
  isRTL = false,
}) => {
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';

  const renderDeleteButton = () => {
    if (!isSelectMode || !onDeleteSelected) return null;

    return (
      <TouchableOpacity
        onPress={onDeleteSelected}
        style={[styles.deleteButton, selectedCount === 0 && styles.disabled]}
        disabled={selectedCount === 0}
      >
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
        {selectedCount > 0 && (
          <Text style={styles.deleteCount}>({selectedCount})</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, isRTL && styles.containerRTL, containerStyle]}
    >
      <Text style={[styles.title, { color: textColor }, titleStyle]}>
        {title}
      </Text>
      {rightComponent || renderDeleteButton()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  containerRTL: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    flex: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  deleteCount: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default ScreenTitle;
