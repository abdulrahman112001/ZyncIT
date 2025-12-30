import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useSMSStore } from '../../store/smsStore';

const ComposeMessageScreen = ({ navigation }: any) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { colors, t } = useTheme();
  const { addMessage } = useSMSStore();

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف');
      return;
    }
    if (!message.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الرسالة');
      return;
    }

    setIsSending(true);
    try {
      // Add message to store
      const newMessage = {
        id: Date.now().toString(),
        phoneNumber: phoneNumber.trim(),
        contactName: null,
        body: message.trim(),
        timestamp: Date.now(),
        type: 'sent' as const,
        read: true,
        deviceId: 'android',
      };

      addMessage(newMessage);

      Alert.alert('✓', 'تم إرسال الرسالة', [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل إرسال الرسالة');
    }
    setIsSending(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Phone Number Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.text }]}>رقم الهاتف</Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="أدخل رقم الهاتف"
              placeholderTextColor={colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.label, { color: colors.text }]}>الرسالة</Text>
          <View
            style={[
              styles.messageContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.messageInput, { color: colors.text }]}
              placeholder="اكتب رسالتك هنا..."
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>
            {message.length} / 160
          </Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: colors.primary },
            isSending && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={isSending}
        >
          <Text style={styles.sendButtonIcon}>📤</Text>
          <Text style={styles.sendButtonText}>
            {isSending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  messageContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  messageInput: {
    fontSize: 16,
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 12,
    marginTop: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default ComposeMessageScreen;
