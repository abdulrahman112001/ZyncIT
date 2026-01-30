import Icon from 'react-native-vector-icons/Ionicons';
import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, PanResponder, Linking } from 'react-native';
import { AppNotification } from '../../../../services/notificationService';
import { styles } from '../styles';
import { formatTime } from '../helper';

interface MessageBubbleProps {
  item: AppNotification;
  onDelete: (id: string) => void;
  isRTL: boolean;
  textColor: string;
  secondaryTextColor: string;
  bubbleColor: string;
  bgColor: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  item,
  onDelete,
  isRTL,
  textColor,
  secondaryTextColor,
  bubbleColor,
  bgColor,
}) => {
  const isSent = item.smsType === 'sent';
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeThreshold = 100;
  const maxSwipe = 100;

  const onDeleteRef = useRef(onDelete);
  const isRTLRef = useRef(isRTL);
  const itemIdRef = useRef(item.id);

  useEffect(() => {
    onDeleteRef.current = onDelete;
    isRTLRef.current = isRTL;
    itemIdRef.current = item.id;
  }, [onDelete, isRTL, item.id]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRTLRef.current) {
          if (gestureState.dx > 0)
            translateX.setValue(Math.min(gestureState.dx, maxSwipe));
        } else {
          if (gestureState.dx < 0)
            translateX.setValue(Math.max(gestureState.dx, -maxSwipe));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldDelete = isRTLRef.current
          ? gestureState.dx > swipeThreshold
          : gestureState.dx < -swipeThreshold;

        if (shouldDelete) {
          Animated.timing(translateX, {
            toValue: isRTLRef.current ? 400 : -400,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onDeleteRef.current(itemIdRef.current));
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const phoneRegex = /(\d{10,})/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <Text
            key={index}
            style={styles.linkText}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }

      const phoneParts = part.split(phoneRegex);
      return phoneParts.map((phonePart, phoneIndex) => {
        if (phoneRegex.test(phonePart)) {
          return (
            <Text
              key={`${index}-${phoneIndex}`}
              style={styles.linkText}
              onPress={() => Linking.openURL(`tel:${phonePart}`)}
            >
              {phonePart}
            </Text>
          );
        }
        return <Text key={`${index}-${phoneIndex}`}>{phonePart}</Text>;
      });
    });
  };

  return (
    <View style={styles.bubbleContainer}>
      <View
        style={[styles.deleteBackground, isRTL ? { left: 0 } : { right: 0 }]}
      >
        <Icon name="trash" size={24} color="#FFFFFF" />
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.bubbleWrapper,
          { transform: [{ translateX }], backgroundColor: bgColor },
        ]}
      >
        <Text
          style={[
            styles.timeLabel,
            { color: secondaryTextColor },
            isSent && styles.timeRight,
          ]}
        >
          {formatTime(item.timestamp)}
        </Text>
        <View
          style={[
            styles.bubble,
            { backgroundColor: isSent ? '#0A84FF' : bubbleColor },
            isSent && styles.bubbleSent,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isSent ? '#FFFFFF' : textColor },
            ]}
          >
            {renderTextWithLinks(item.text)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default MessageBubble;
