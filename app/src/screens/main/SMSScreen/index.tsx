import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { EmptyState } from '../../../components/shared';
import { styles } from './styles';
import { formatTime } from './helper';
import { Conversation } from './types';
import { useSMSScreen } from './useSMSScreen';

const SMSScreen = () => {
  const {
    conversations,
    isLoading,
    initialLoading,
    permissionGranted,
    showCompose,
    phoneNumber,
    messageText,
    isSending,
    colors,
    isDarkMode,
    isRTL,
    bgColor,
    secondaryTextColor,
    setPhoneNumber,
    setMessageText,
    openCompose,
    closeCompose,
    loadFromDevice,
    handleSendMessage,
    handleMarkAllAsRead,
    handleDeleteAll,
  } = useSMSScreen();

  const renderConversation = ({ item }: { item: Conversation }) => (
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
            {item.lastMessage.type === 'sent' && '↩ '}
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

  const renderEmptyComponent = () => (
    <EmptyState
      icon="💬"
      title={isRTL ? 'لا توجد رسائل' : 'No Messages'}
      subtitle={
        permissionGranted
          ? isRTL
            ? 'اسحب للأسفل للتحديث'
            : 'Pull down to refresh'
          : isRTL
          ? 'الرجاء السماح بأذونات الرسائل'
          : 'Please allow SMS permissions'
      }
      isDarkMode={isDarkMode}
    />
  );

  const renderHeader = () => (
    <View style={[styles.headerActions, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
        onPress={handleMarkAllAsRead}
      >
        <Text style={[styles.actionButtonText, { color: colors.primary }]}>
          {isRTL ? '✓ تعليم الكل كمقروء' : '✓ Mark All Read'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#ffebee' }]}
        onPress={handleDeleteAll}
      >
        <Text style={[styles.actionButtonText, { color: colors.error }]}>
          {isRTL ? '🗑 حذف الكل' : '🗑 Delete All'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (initialLoading && conversations.length === 0) {
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
        ListEmptyComponent={renderEmptyComponent}
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
        onPress={openCompose}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={showCompose}
        animationType="slide"
        transparent
        onRequestClose={closeCompose}
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
                {isRTL ? 'رسالة جديدة' : 'New Message'}
              </Text>
              <TouchableOpacity onPress={closeCompose}>
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
                placeholder={isRTL ? 'رقم الهاتف' : 'Phone Number'}
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
                placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
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
                {isSending
                  ? isRTL
                    ? 'جاري الإرسال...'
                    : 'Sending...'
                  : isRTL
                  ? 'إرسال'
                  : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default SMSScreen;
