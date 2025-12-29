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
  const [showCompose, setShowCompose] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { colors } = useTheme();

  // Sort messages by timestamp descending
  const allMessages = React.useMemo(() => {
    console.log('[SMSScreen] Messages updated, count:', messages.length);
    return [...messages].sort((a, b) => b.timestamp - a.timestamp);
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
              type: msg.type === 1 ? 'received' : 'sent',
              read: msg.read === 1,
              deviceId: 'android',
              syncedAt: Date.now(),
            }));
            // Add device messages to the store
            formattedMessages.forEach(msg => addMessage(msg));
          }
        }
      } catch (error) {
        console.error('[SMSScreen] Error loading SMS:', error);
      }
    }
  }, [addMessage]);

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

  const renderMessage = ({ item }: { item: SMS }) => (
    <TouchableOpacity
      style={[styles.messageItem, { backgroundColor: colors.surface }]}
    >
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: item.read ? colors.primaryLight : colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: item.read ? colors.primary : '#fff' },
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
              !item.read && styles.unreadText,
            ]}
            numberOfLines={1}
          >
            {item.contactName || item.phoneNumber || 'Unknown'}
          </Text>
          <Text style={[styles.messageTime, { color: colors.textSecondary }]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
        <View style={styles.messagePreview}>
          <Text
            style={[
              styles.messageBody,
              { color: colors.textSecondary },
              !item.read && styles.unreadText,
            ]}
            numberOfLines={2}
          >
            {item.type === 'sent' && '→ '}
            {item.body}
          </Text>
          {!item.read && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.primary }]}
            />
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={allMessages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          allMessages.length === 0 && styles.emptyList,
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
  unreadBadge: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
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
});

export default SMSScreen;
