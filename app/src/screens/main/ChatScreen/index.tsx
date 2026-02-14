import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EmptyState, ScreenTitle } from '../../../components/shared';
import { Container, AnimatedListItem } from '../../../components';
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
  const renderMessageItem = ({
    item,
    index,
  }: {
    item: Message;
    index: number;
  }) => {
    const isMyMessage = (item as any).senderDeviceId === currentDevice?.id;
    const msgType = (item as any).type;
    const fileUrl = (item as any).fileUrl;

    return (
      <AnimatedListItem index={index}>
        <View
          style={[
            styles.messageWrapper,
            isMyMessage && styles.myMessageWrapper,
          ]}
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
                      ? colors.overlay
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
                    { color: isMyMessage ? colors.textInverse : textColor },
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
                  { color: isMyMessage ? colors.textInverse : textColor },
                ]}
              >
                {item.content}
              </Text>
            )}

            <Text
              style={[
                styles.messageTime,
                {
                  color: isMyMessage
                    ? 'rgba(255,255,255,0.6)'
                    : secondaryTextColor,
                },
              ]}
            >
              {new Date(item.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedListItem>
    );
  };

  const renderHeader = () => <View style={styles.headerSpacer} />;

  const renderDeleteButton = () => (
    <TouchableOpacity
      onPress={deleteAllMessages}
      style={styles.deleteAllButton}
    >
      <Ionicons name="trash-outline" size={22} color={colors.error} />
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
    <Container
      isDark={isDarkMode}
      noPaddingHorizontal
      backgroundColor={bgColor}
    >
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
            <Text style={[styles.replyLabel, { color: colors.primaryText }]}>
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
              backgroundColor: isDarkMode
                ? colors.surfaceSecondary
                : colors.surfaceTertiary,
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
            <ActivityIndicator size="small" color={colors.textInverse} />
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
            <Ionicons name="close" size={32} color="#FFFFFF" />
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
    </Container>
  );
};

export default ChatScreen;
