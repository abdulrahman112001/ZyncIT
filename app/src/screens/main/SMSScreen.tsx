import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSMSStore } from '../../store/smsStore';
import { SMS } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import smsService from '../../services/smsService';

const SMSScreen = () => {
  // Use individual selectors to ensure proper updates
  const messages = useSMSStore(state => state.messages);
  const isLoading = useSMSStore(state => state.isLoading);
  const addMessage = useSMSStore(state => state.addMessage);
  const setMessages = useSMSStore(state => state.setMessages);
  const syncMessages = useSMSStore(state => state.syncMessages);
  const markAllAsRead = useSMSStore(state => state.markAllAsRead);
  const deleteAllMessages = useSMSStore(state => state.deleteAllMessages);
  const deleteMessage = useSMSStore(state => state.deleteMessage);
  const [showCompose, setShowCompose] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { colors, isDarkMode, isRTL } = useTheme();

  // Dynamic colors
  const bgColor = isDarkMode ? '#000000' : colors.background;
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;
  const secondaryTextColor = isDarkMode ? '#8E8E93' : colors.textSecondary;

  // Group messages by phone number into conversations
  const conversations = React.useMemo(() => {
    console.log('[SMSScreen] Messages updated, count:', messages.length);

    const grouped: {
      [key: string]: {
        phoneNumber: string;
        contactName?: string;
        messages: SMS[];
        lastMessage: SMS;
        unreadCount: number;
      };
    } = {};

    // التأكد من أن messages array قبل المعالجة
    const validMessages = Array.isArray(messages) ? messages : [];

    validMessages.forEach(msg => {
      // Normalize phone number for grouping
      const rawPhone = msg.phoneNumber || 'Unknown';
      const normalizedPhone = rawPhone.replace(/[\s\-\(\)\.]/g, '').trim();
      const key = normalizedPhone || 'Unknown';

      if (!grouped[key]) {
        grouped[key] = {
          phoneNumber: rawPhone,
          contactName: msg.contactName,
          messages: [],
          lastMessage: msg,
          unreadCount: 0,
        };
      }

      grouped[key].messages.push(msg);
      if (!msg.read) grouped[key].unreadCount++;

      if (msg.timestamp > grouped[key].lastMessage.timestamp) {
        grouped[key].lastMessage = msg;
        if (msg.contactName) {
          grouped[key].contactName = msg.contactName;
        }
      }
    });

    // Sort by last message timestamp descending
    return Object.values(grouped).sort(
      (a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp,
    );
  }, [messages]);

  // Force re-render when messages change
  useEffect(() => {
    console.log('[SMSScreen] Store messages changed:', messages.length);
  }, [messages]);

  const loadFromDevice = useCallback(async () => {
    if (Platform.OS === 'android' && smsService) {
      try {
        const hasPermissions = await smsService.requestPermissions();
        setPermissionGranted(hasPermissions);

        if (hasPermissions) {
          const deviceMessages = await smsService.getAllSms();
          console.log(
            '[SMSScreen] Loaded SMS from device:',
            deviceMessages?.length || 0,
          );

          if (deviceMessages && deviceMessages.length > 0) {
            const formattedMessages: SMS[] = deviceMessages.map((msg: any) => ({
              id: String(msg._id || msg.id || Date.now()),
              threadId: msg.thread_id || '',
              userId: '',
              phoneNumber: msg.address || '',
              contactName: undefined,
              body: msg.body || '',
              timestamp: Number(msg.date) || Date.now(),
              type: msg.type === 1 ? 'inbox' : 'sent',
              read: msg.read === 1,
              deviceId: 'android',
              syncedAt: Date.now(),
            }));
            // Add device messages to the store
            formattedMessages.forEach(msg => addMessage(msg));

            // Sync to Firebase
            await syncMessages(deviceMessages);
            console.log('[SMSScreen] Messages synced to Firebase');
          }
        }
      } catch (error) {
        console.error('[SMSScreen] Error loading SMS:', error);
      } finally {
        setInitialLoading(false);
      }
    } else {
      setInitialLoading(false);
    }
  }, [addMessage, syncMessages]);

  useEffect(() => {
    loadFromDevice();
  }, [loadFromDevice]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSendMessage = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Enter phone number');
      return;
    }
    if (!messageText.trim()) {
      Alert.alert('Error', 'Enter message');
      return;
    }
    setIsSending(true);
    try {
      if (smsService) {
        const success = await smsService.sendSms(
          phoneNumber.trim(),
          messageText.trim(),
        );
        if (success) {
          const newMessage: SMS = {
            id: Date.now().toString(),
            threadId: '',
            userId: '',
            deviceId: 'android',
            phoneNumber: phoneNumber.trim(),
            contactName: undefined,
            body: messageText.trim(),
            timestamp: Date.now(),
            type: 'sent',
            read: true,
            syncedAt: Date.now(),
          };
          addMessage(newMessage);
          setShowCompose(false);
          setPhoneNumber('');
          setMessageText('');
          Alert.alert('Success', 'Message sent');
        } else {
          Alert.alert('Error', 'Failed to send');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send');
    }
    setIsSending(false);
  };

  const renderConversation = ({
    item,
  }: {
    item: (typeof conversations)[0];
  }) => (
    <TouchableOpacity
      style={[styles.messageItem, { backgroundColor: colors.surface }]}
    >
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor:
                item.unreadCount > 0 ? colors.primary : colors.primaryLight,
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: item.unreadCount > 0 ? '#fff' : colors.primary },
            ]}
          >
            {(item.contactName || item.phoneNumber || '?')
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text
            style={[
              styles.senderName,
              { color: colors.text },
              item.unreadCount > 0 && styles.unreadText,
            ]}
            numberOfLines={1}
          >
            {item.contactName || item.phoneNumber || 'Unknown'}
          </Text>
          <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
            {formatTime(item.lastMessage.timestamp)}
          </Text>
        </View>
        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.messageBody,
              { color: colors.textSecondary },
              item.unreadCount > 0 && styles.unreadText,
            ]}
            numberOfLines={2}
          >
            {item.lastMessage.type === 'sent' && '→ '}
            {item.lastMessage.body}
          </Text>
          {item.unreadCount > 0 && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📱</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Messages
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {permissionGranted
          ? 'Pull down to refresh'
          : 'Please allow SMS permissions'}
      </Text>
    </View>
  );

  const handleMarkAllAsRead = () => {
    Alert.alert('Mark All as Read', 'Mark all messages as read?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark All',
        onPress: async () => {
          await markAllAsRead();
          setShowActions(false);
        },
      },
    ]);
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Messages',
      `Are you sure you want to delete all ${messages.length} messages? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await deleteAllMessages();
            setShowActions(false);
          },
        },
      ],
    );
  };

  const renderHeader = () => (
    <View style={[styles.headerActions, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
        onPress={handleMarkAllAsRead}
      >
        <Text style={[styles.actionButtonText, { color: colors.primary }]}>
          ✓ Mark All Read
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#ffebee' }]}
        onPress={handleDeleteAll}
      >
        <Text style={[styles.actionButtonText, { color: colors.error }]}>
          🗑 Delete All
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Show loading indicator on initial load
  if (initialLoading && messages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={bgColor}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />
      {conversations.length > 0 && renderHeader()}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.phoneNumber}
        contentContainerStyle={[
          styles.listContent,
          conversations.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadFromDevice}
            colors={[colors.primary]}
          />
        }
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowCompose(true)}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showCompose}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompose(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                New Message
              </Text>
              <TouchableOpacity onPress={() => setShowCompose(false)}>
                <Text style={[styles.closeButton, { color: colors.error }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={[styles.inputContainer, { borderColor: colors.border }]}
            >
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Phone Number"
                placeholderTextColor={colors.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
            <View
              style={[
                styles.messageInputContainer,
                { borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.messageInput, { color: colors.text }]}
                placeholder="Type your message..."
                placeholderTextColor={colors.textSecondary}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {messageText.length} / 160
            </Text>
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary },
                isSending && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={isSending}
            >
              <Text style={styles.sendButtonText}>
                {isSending ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: { padding: 8 },
  emptyList: { flexGrow: 1 },
  messageItem: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: { marginRight: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600' },
  messageContent: { flex: 1 },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: { flex: 1, fontSize: 15, marginRight: 8 },
  unreadText: { fontWeight: '600' },
  messageTime: { fontSize: 11 },
  messagePreview: { flexDirection: 'row', alignItems: 'center' },
  messageBody: { flex: 1, fontSize: 13, lineHeight: 18 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeButton: { fontSize: 24, fontWeight: 'bold' },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  input: { height: 50, fontSize: 16 },
  messageInputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  messageInput: { fontSize: 16, minHeight: 100 },
  charCount: { textAlign: 'right', fontSize: 12, marginBottom: 16 },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 12,
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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

export default SMSScreen;
