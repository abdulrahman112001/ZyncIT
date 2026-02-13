import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import { ConversationScreenProps } from './types';
import { styles } from './styles';
import { getInitials } from './helper';
import MessageBubble from './components/MessageBubble';
import { useConversationScreen } from './useConversationScreen';

const ConversationScreen = ({ route, navigation }: ConversationScreenProps) => {
  const { title, appName, type, phoneNumber } = route.params;

  const {
    conversationNotifications,
    smsMessages,
    isSmsLoading,
    isSMSType,
    isRTL,
    isDarkMode,
    colors,
    bgColor,
    textColor,
    secondaryTextColor,
    bubbleColor,
    headerBgColor,
    borderColor,
    flatListRef,
    handleDelete,
    goBack,
  } = useConversationScreen({ title, appName, type, phoneNumber }, navigation);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: headerBgColor, borderBottomColor: borderColor },
        ]}
      >
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.primary }]}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View
            style={[
              styles.headerAvatar,
              { backgroundColor: isDarkMode ? '#3A3A3C' : '#C7C7CC' },
            ]}
          >
            <Text style={styles.headerAvatarText}>{getInitials(title)}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text
              style={[styles.headerName, { color: textColor }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text style={[styles.headerChevron, { color: secondaryTextColor }]}>
              ›
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: secondaryTextColor }]}>
            {isSMSType ? 'Text Message • SMS' : appName}
          </Text>
        </View>
      </View>

      {/* Messages */}
      {isSmsLoading && smsMessages.length === 0 && type === 'sms' ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: secondaryTextColor }}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={conversationNotifications}
          renderItem={({ item }) => (
            <MessageBubble
              item={item}
              onDelete={handleDelete}
              isRTL={isRTL}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
              bubbleColor={bubbleColor}
              bgColor={bgColor}
              primaryColor={colors.primary}
            />
          )}
          keyExtractor={item => item.id}
          inverted={true}
          style={{ flex: 1, backgroundColor: bgColor }}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isSMSType ? 20 : 20 },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ConversationScreen;
