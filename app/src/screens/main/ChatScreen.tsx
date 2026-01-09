import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthStore } from '../../store/authStore';
import { useDeviceStore } from '../../store/deviceStore';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
  };
  timestamp: number;
  read: boolean;
}

const ChatScreen = () => {
  const { colors, isRTL, isDarkMode } = useTheme();
  const { user } = useAuthStore();
  const { currentDevice } = useDeviceStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard listener for Android
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Dynamic colors based on theme (matching CallsScreen)
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const surfaceColor = isDarkMode ? '#1C1C1E' : '#F2F2F7';

  // Upload file to Firebase Storage
  const uploadFile = async (
    uri: string,
    fileName: string,
    fileType: string,
  ): Promise<string> => {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `chat_files/${user?.uid}/${timestamp}_${sanitizedName}`;

    console.log('Uploading file to:', storagePath);
    console.log('File URI:', uri);

    try {
      const reference = storage().ref(storagePath);

      // Upload the file
      const task = reference.putFile(uri);

      // Wait for upload to complete
      await task;

      console.log('Upload complete, getting download URL...');
      const downloadUrl = await reference.getDownloadURL();
      console.log('Download URL:', downloadUrl);
      return downloadUrl;
    } catch (error: any) {
      console.error('Storage upload error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      throw error;
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri) {
          await sendFileMessage(
            asset.uri,
            asset.fileName || 'image.jpg',
            'image',
          );
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.uri) {
          await sendFileMessage(
            asset.uri,
            asset.fileName || 'photo.jpg',
            'image',
          );
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Send file message
  const sendFileMessage = async (
    uri: string,
    fileName: string,
    type: 'image' | 'file',
  ) => {
    if (!user?.uid || !currentDevice) return;

    setIsUploading(true);
    try {
      const downloadUrl = await uploadFile(uri, fileName, type);

      await firestore()
        .collection('chats')
        .add({
          senderId: user.uid,
          senderDeviceId: currentDevice.id,
          senderName:
            (currentDevice as any).nickname || currentDevice.name || 'Mobile',
          senderPlatform: (currentDevice as any).platform || 'android',
          receiverId: user.uid,
          receiverDeviceId: null,
          content: type === 'image' ? '📷 Image' : `📎 ${fileName}`,
          type: type,
          fileUrl: downloadUrl,
          fileName: fileName,
          read: false,
          timestamp: Date.now(),
          participants: [user.uid],
        });
    } catch (error) {
      console.error('Error sending file:', error);
      Alert.alert('Error', 'Failed to send file');
    }
    setIsUploading(false);
  };

  // Subscribe to messages for user's account (same structure as extension)
  useEffect(() => {
    if (!user?.uid || !currentDevice) {
      console.log('No user or device for chat subscription');
      return;
    }

    console.log('Subscribing to chats for user:', user.uid);
    setIsLoading(true);

    // Simple query without orderBy to avoid index issues
    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', user.uid)
      .limit(100)
      .onSnapshot(
        snapshot => {
          console.log('Got chat snapshot, docs:', snapshot.size);
          const msgs: Message[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            console.log('Message:', doc.id, data.content);
            msgs.push({ id: doc.id, ...data } as Message);
          });
          // Sort locally by timestamp
          msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(msgs);
          setIsLoading(false);
        },
        error => {
          console.error('Error loading messages:', error);
          setIsLoading(false);
        },
      );

    return () => unsubscribe();
  }, [user?.uid, currentDevice]);

  // Subscribe to typing status - disabled for now as we use flat structure
  useEffect(() => {
    // Typing indicators not used in flat chat structure
  }, [user?.uid, currentDevice]);

  // Send typing indicator - disabled for flat structure
  const sendTypingIndicator = async () => {
    // Not used in flat chat structure
  };

  // Send message - same structure as extension
  const sendMessage = async () => {
    if (!inputText.trim() || !user?.uid || !currentDevice) {
      console.log('Cannot send: missing data', {
        text: inputText.trim(),
        userId: user?.uid,
        device: currentDevice?.id,
      });
      return;
    }

    const messageData: any = {
      senderId: user.uid,
      senderDeviceId: currentDevice.id,
      senderName:
        (currentDevice as any).nickname ||
        currentDevice.name ||
        (currentDevice as any).model ||
        'Android Device',
      senderPlatform: (currentDevice as any).platform || 'android',
      receiverId: user.uid,
      content: inputText.trim(),
      type: 'text',
      read: false,
      timestamp: Date.now(),
      participants: [user.uid],
    };

    // Add reply info if replying to a message
    if (replyTo) {
      messageData.replyTo = {
        id: replyTo.id,
        content: replyTo.content,
        senderId: replyTo.senderId,
      };
    }

    console.log('Sending message:', messageData);

    try {
      await firestore().collection('chats').add(messageData);

      console.log('Message sent successfully');
      setInputText('');
      setReplyTo(null);
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Render message item
  const renderMessageItem = ({ item }: { item: Message }) => {
    // Check if message is from current device
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
            { backgroundColor: isMyMessage ? '#0A84FF' : surfaceColor },
          ]}
          onLongPress={() => setReplyTo(item)}
        >
          {/* Show image if type is image */}
          {msgType === 'image' && fileUrl && (
            <Image
              source={{ uri: fileUrl }}
              style={styles.chatImage}
              resizeMode="cover"
            />
          )}

          {/* Show file link if type is file */}
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
                // Open file URL
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

          {/* Show text content */}
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

  // Render header (matching CallsScreen)
  const renderHeader = () => <View style={styles.headerSpacer} />;

  // Delete all messages
  const deleteAllMessages = async () => {
    if (messages.length === 0) {
      Alert.alert(
        isRTL ? 'لا توجد رسائل' : 'No Messages',
        isRTL ? 'لا توجد رسائل للحذف' : 'There are no messages to delete',
      );
      return;
    }

    Alert.alert(
      isRTL ? 'حذف جميع الرسائل' : 'Delete All Messages',
      isRTL
        ? 'هل أنت متأكد من حذف جميع الرسائل؟ لا يمكن التراجع عن هذا.'
        : 'Are you sure you want to delete all messages? This cannot be undone.',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const batch = firestore().batch();
              messages.forEach(msg => {
                const ref = firestore().collection('chats').doc(msg.id);
                batch.delete(ref);
              });
              await batch.commit();
              Alert.alert(
                isRTL ? 'تم' : 'Done',
                isRTL ? 'تم حذف جميع الرسائل' : 'All messages deleted',
              );
            } catch (error) {
              console.error('Error deleting messages:', error);
              Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل حذف الرسائل' : 'Failed to delete messages',
              );
            }
          },
        },
      ],
    );
  };

  const renderTitle = () => (
    <View style={styles.titleContainer}>
      <Text style={[styles.title, { color: textColor }]}>
        {isRTL ? 'الدردشة' : 'Chat'}
      </Text>
      {isTyping && (
        <Text style={[styles.typingText, { color: '#0A84FF' }]}>
          {isRTL ? 'يكتب...' : 'typing...'}
        </Text>
      )}
      <TouchableOpacity
        onPress={deleteAllMessages}
        style={styles.deleteAllButton}
      >
        <Ionicons name="trash-outline" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  if (!user || !currentDevice) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        {isRTL ? 'لا توجد رسائل' : 'No Messages'}
      </Text>
      <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
        {isRTL
          ? 'ابدأ محادثة مع أجهزتك الأخرى'
          : 'Start a conversation with your other devices'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />
      {renderHeader()}
      {renderTitle()}

      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
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
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {replyTo && (
        <View style={[styles.replyPreview, { backgroundColor: surfaceColor }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.replyLabel, { color: '#0A84FF' }]}>
              {isRTL ? 'الرد على:' : 'Replying to:'}
            </Text>
            <Text
              style={[styles.replyPreviewText, { color: textColor }]}
              numberOfLines={1}
            >
              {replyTo.content}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
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
        {/* Image button */}
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickImage}
          disabled={isUploading}
        >
          <Ionicons name="image-outline" size={24} color={secondaryTextColor} />
        </TouchableOpacity>

        {/* Camera button */}
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

        <TextInput
          style={[
            styles.input,
            {
              color: textColor,
              backgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA',
            },
          ]}
          value={inputText}
          onChangeText={text => {
            setInputText(text);
            if (text.length > 0) {
              sendTypingIndicator();
            }
          }}
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
                backgroundColor: '#0A84FF',
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    paddingTop: 50,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  deleteAllButton: {
    padding: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
  },
  typingText: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyListContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageWrapper: {
    marginBottom: 12,
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    padding: 8,
    borderRadius: 8,
    maxWidth: '75%',
  },
  replyBar: {
    width: 3,
    marginRight: 8,
    borderRadius: 2,
  },
  replyText: {
    fontSize: 14,
    flex: 1,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  replyPreviewText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A84FF',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  fileName: {
    fontSize: 14,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
});

export default ChatScreen;
