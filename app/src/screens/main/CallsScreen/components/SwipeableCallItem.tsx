import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GroupedCall } from '../types';
import { styles } from '../styles';
import {
  ACTION_WIDTH,
  formatTime,
  getInitials,
  getCallTypeIndicator,
} from '../helper';

const SwipeableCallItem = ({
  item,
  onPress,
  onDelete,
  isRTL,
  isDarkMode,
  textColor,
  secondaryTextColor,
  bgColor,
  avatarBgColor,
  isSelectMode,
  isSelected,
  onToggleSelect,
}: {
  item: GroupedCall;
  onPress: () => void;
  onDelete: () => void;
  isRTL: boolean;
  isDarkMode: boolean;
  textColor: string;
  secondaryTextColor: string;
  bgColor: string;
  avatarBgColor: string;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const handleSwipe = (direction: 'left' | 'right') => {
    const toValue = direction === 'left' ? -ACTION_WIDTH : ACTION_WIDTH;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setSwiped(true);
  };

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
    setSwiped(false);
  };

  const typeInfo = getCallTypeIndicator(item.lastType);
  const displayName = item.contactName || item.phoneNumber;
  const isMissed = item.lastType === 'missed' || item.lastType === 'rejected';

  return (
    <View style={[styles.swipeContainer, { backgroundColor: bgColor }]}>
      {!isSelectMode && (
        <View
          style={[
            styles.actionsContainer,
            isRTL ? styles.actionsLeft : styles.actionsRight,
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              onDelete();
            }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[
          styles.callRow,
          {
            backgroundColor: bgColor,
            transform: [{ translateX: isSelectMode ? 0 : translateX }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (isSelectMode && onToggleSelect) {
              onToggleSelect();
            } else if (swiped) {
              resetSwipe();
            } else {
              onPress();
            }
          }}
          onLongPress={() => {
            if (!isSelectMode) {
              handleSwipe(isRTL ? 'right' : 'left');
            }
          }}
          delayLongPress={300}
          style={styles.rowContent}
          activeOpacity={0.7}
        >
          {/* Checkbox for select mode */}
          {isSelectMode && (
            <View style={styles.checkboxContainer}>
              <View
                style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </View>
          )}

          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: avatarBgColor }]}>
              <Text style={[styles.avatarText, { color: textColor }]}>
                {getInitials(item.contactName || '', item.phoneNumber)}
              </Text>
            </View>
          </View>

          <View style={styles.callContent}>
            <View style={styles.topRow}>
              <View style={styles.nameRow}>
                <Text
                  style={[
                    styles.callerName,
                    { color: textColor },
                    isMissed && styles.missedCallName,
                  ]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                {item.count > 1 && (
                  <Text
                    style={[styles.callCount, { color: secondaryTextColor }]}
                  >
                    ({item.count})
                  </Text>
                )}
              </View>
              <View style={styles.timeContainer}>
                <Text style={[styles.timeText, { color: secondaryTextColor }]}>
                  {formatTime(item.lastTimestamp)}
                </Text>
                <Text
                  style={[styles.chevron, { color: secondaryTextColor }]}
                ></Text>
              </View>
            </View>
            <View style={styles.subtitleRow}>
              <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
              <Text style={[styles.phoneText, { color: secondaryTextColor }]}>
                {item.phoneNumber}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
      <View style={styles.separator} />
    </View>
  );
};

export default SwipeableCallItem;
