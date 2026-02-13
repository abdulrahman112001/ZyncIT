import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  StatusBar,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EmptyState, ScreenTitle } from '../../../components/shared';
import { Message } from './types';
import { styles } from './styles';
import { useChatScreen } from './useChatScreen';

const ChatScreen = () => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    messages,
    inputText,
    replyTo,
    isTyping,
    isLoading,
    isUploading,
    keyboardHeight,
    user,
    currentDevice,
    colors,
    isRTL,
    isDarkMode,
    bgColor,
    textColor,
    secondaryTextColor,
    surfaceColor,
    flatListRef,
    handleInputChange,
    clearReply,
    setReplyMessage,
    pickImage,
    takePhoto,
    pickDocument,
    sendMessage,
    deleteAllMessages,
    scrollToEnd,
  } = useChatScreen();

  // Render message item
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMyMessage = (item as any).senderDeviceId === currentDevice?.id;
    const msgType = (item as any).type;
    const fileUrl = (item as any).fileUrl;

    return (
      <View
        style={[styles.messageWrapper, isMyMessage && styles.myMessageWrapper]}
      >
        {!isMyMessage && (
          <Text style={[styles.senderName, { color: secondaryTextColor }]}>
            {(item as any).senderName || 'Unknown'} •{' '}
            {(item as any).senderPlatform || 'device'}
          </Text>
        )}
        {item.replyTo && (
          <View
            style={[styles.replyContainer, { backgroundColor: surfaceColor }]}
          >
            <View
              style={[styles.replyBar, { backgroundColor: colors.primary }]}
            />
            <Text
              style={[styles.replyText, { color: secondaryTextColor }]}
              numberOfLines={1}
            >
              {item.replyTo.content}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[
            styles.messageBubble,
            { backgroundColor: isMyMessage ? colors.primary : surfaceColor },
          ]}
          onLongPress={() => setReplyMessage(item)}
        >
          {msgType === 'image' && fileUrl && (
            <TouchableOpacity onPress={() => setPreviewImage(fileUrl)}>
              <Image
                source={{ uri: fileUrl }}
                style={styles.chatImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {msgType === 'file' && fileUrl && (
            <TouchableOpacity
              style={[
                styles.fileLink,
                {
                  backgroundColor: isMyMessage
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.05)',
                },
              ]}
              onPress={() => {
                import('react-native').then(({ Linking }) => {
                  Linking.openURL(fileUrl);
                });
              }}
            >
              <Text style={{ fontSize: 24 }}>📄</Text>
              <Text
                style={[
                  styles.fileName,
                  { color: isMyMessage ? '#fff' : textColor },
                ]}
              >
                {(item as any).fileName || 'File'}
              </Text>
            </TouchableOpacity>
          )}

          {(!msgType || msgType === 'text') && (
            <Text
              style={[
                styles.messageText,
                { color: isMyMessage ? '#fff' : textColor },
              ]}
            >
              {item.content}
            </Text>
          )}

          <Text
            style={[
              styles.messageTime,
              { color: isMyMessage ? '#fff9' : secondaryTextColor },
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => <View style={styles.headerSpacer} />;

  const renderDeleteButton = () => (
    <TouchableOpacity
      onPress={deleteAllMessages}
      style={styles.deleteAllButton}
    >
      <Ionicons name="trash-outline" size={22} color="#FF3B30" />
    </TouchableOpacity>
  );

  if (!user || !currentDevice) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderEmptyComponent = () => (
    <EmptyState
      icon="💬"
      title={isRTL ? 'لا توجد رسائل' : 'No Messages'}
      subtitle={
        isRTL
          ? 'ابدأ محادثة مع أجهزتك الأخرى'
          : 'Start a conversation with your other devices'
      }
      isDarkMode={isDarkMode}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />
      {renderHeader()}

      {/* Screen Title with Delete button */}
      <ScreenTitle
        title={isRTL ? 'الدردشة' : 'Chat'}
        isDarkMode={isDarkMode}
        isRTL={isRTL}
        rightComponent={renderDeleteButton()}
      />

      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyListContent,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListEmptyComponent={renderEmptyComponent}
          onContentSizeChange={scrollToEnd}
        />
      )}

      {replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: surfaceColor }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.replyLabel, { color: colors.primary }]}>
              {isRTL ? 'الرد على:' : 'Replying to:'}
            </Text>
            <Text
              style={[styles.replyPreviewText, { color: textColor }]}
              numberOfLines={1}
            >
              {replyTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={clearReply}>
            <Text style={{ color: secondaryTextColor, fontSize: 20 }}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          { backgroundColor: surfaceColor },
          Platform.OS === 'android' &&
            keyboardHeight > 0 && { marginBottom: keyboardHeight - 70 },
        ]}
      >
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickImage}
          disabled={isUploading}
        >
          <Ionicons name="image-outline" size={24} color={secondaryTextColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.attachButton}
          onPress={takePhoto}
          disabled={isUploading}
        >
          <Ionicons
            name="camera-outline"
            size={24}
            color={secondaryTextColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickDocument}
          disabled={isUploading}
        >
          <Ionicons
            name="attach-outline"
            size={24}
            color={secondaryTextColor}
          />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA',
            },
          ]}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
          placeholderTextColor={secondaryTextColor}
          multiline
        />

        {isUploading ? (
          <View style={styles.sendButton}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.primary,
                opacity: inputText.trim() ? 1 : 0.5,
              },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendButtonText}>↑</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.95)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setPreviewImage(null)}
        >
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              zIndex: 10,
              padding: 10,
            }}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          {previewImage && (
            <Image
              source={{ uri: previewImage }}
              style={{
                width: Dimensions.get('window').width - 40,
                height: Dimensions.get('window').height * 0.7,
              }}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ChatScreen;
