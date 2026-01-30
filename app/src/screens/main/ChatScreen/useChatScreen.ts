import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Keyboard } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthStore } from '../../../store/authStore';
import { useDeviceStore } from '../../../store/deviceStore';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { FlatList } from 'react-native';
import { Message } from './types';
import { uploadFile } from './helper';

export const useChatScreen = () => {
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

  // Dynamic colors based on theme
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const surfaceColor = isDarkMode ? '#1C1C1E' : '#F2F2F7';

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

  // Pick image from gallery
  const pickImage = useCallback(async () => {
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
    } catch (_error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في اختيار الصورة' : 'Failed to pick image',
      );
    }
  }, [isRTL, user?.uid, currentDevice]);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
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
    } catch (_error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في التقاط الصورة' : 'Failed to take photo',
      );
    }
  }, [isRTL, user?.uid, currentDevice]);

  // Send file message
  const sendFileMessage = useCallback(
    async (uri: string, fileName: string, type: 'image' | 'file') => {
      if (!user?.uid || !currentDevice) return;

      setIsUploading(true);
      try {
        const downloadUrl = await uploadFile(uri, fileName, type, user.uid);

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
      } catch (_error) {
        Alert.alert(
          isRTL ? 'خطأ' : 'Error',
          isRTL ? 'فشل في إرسال الملف' : 'Failed to send file',
        );
      }
      setIsUploading(false);
    },
    [user?.uid, currentDevice, isRTL],
  );

  // Subscribe to messages
  useEffect(() => {
    if (!user?.uid || !currentDevice) {
      return;
    }

    setIsLoading(true);

    const unsubscribe = firestore()
      .collection('chats')
      .where('participants', 'array-contains', user.uid)
      .limit(100)
      .onSnapshot(
        snapshot => {
          const msgs: Message[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            msgs.push({ id: doc.id, ...data } as Message);
          });
          msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          setMessages(msgs);
          setIsLoading(false);
        },
        _error => {
          setIsLoading(false);
        },
      );

    return () => unsubscribe();
  }, [user?.uid, currentDevice]);

  // Send typing indicator - disabled for flat structure
  const sendTypingIndicator = useCallback(async () => {
    // Not used in flat chat structure
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !user?.uid || !currentDevice) {
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

    if (replyTo) {
      messageData.replyTo = {
        id: replyTo.id,
        content: replyTo.content,
        senderId: replyTo.senderId,
      };
    }

    try {
      await firestore().collection('chats').add(messageData);
      setInputText('');
      setReplyTo(null);
    } catch (_error) {
      Alert.alert(
        isRTL ? 'خطأ' : 'Error',
        isRTL ? 'فشل في إرسال الرسالة' : 'Failed to send message',
      );
    }
  }, [inputText, user?.uid, currentDevice, replyTo, isRTL]);

  // Delete all messages
  const deleteAllMessages = useCallback(async () => {
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
            } catch (_error) {
              Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل حذف الرسائل' : 'Failed to delete messages',
              );
            }
          },
        },
      ],
    );
  }, [messages, isRTL]);

  const setReplyMessage = useCallback((message: Message | null) => {
    setReplyTo(message);
  }, []);

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);
      if (text.length > 0) {
        sendTypingIndicator();
      }
    },
    [sendTypingIndicator],
  );

  const clearReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const scrollToEnd = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  return {
    // State
    messages,
    inputText,
    replyTo,
    isTyping,
    isLoading,
    isUploading,
    keyboardHeight,
    user,
    currentDevice,

    // Theme
    colors,
    isRTL,
    isDarkMode,
    bgColor,
    textColor,
    secondaryTextColor,
    surfaceColor,

    // Refs
    flatListRef,

    // Actions
    setInputText,
    handleInputChange,
    setReplyMessage,
    clearReply,
    pickImage,
    takePhoto,
    sendMessage,
    deleteAllMessages,
    scrollToEnd,
  };
};
