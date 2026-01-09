import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const UserSettingsScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const { colors, t, isDarkMode, isRTL } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  // Dynamic colors
  const bgColor = isDarkMode ? '#000000' : colors.background;
  const textColor = isDarkMode ? '#FFFFFF' : colors.text;
  const secondaryTextColor = isDarkMode ? '#8E8E93' : colors.textSecondary;

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      // Update Firebase Auth
      await user?.updateProfile?.({ displayName: displayName.trim() });

      // Update Firestore
      const firestore = require('@react-native-firebase/firestore').default();
      await firestore.collection('users').doc(user?.uid).update({
        displayName: displayName.trim(),
        updatedAt: Date.now(),
      });

      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bgColor }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Header with back button */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon
            name={isRTL ? 'chevron-forward' : 'chevron-back'}
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {t('userSettings')}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('profileInfo')}
          </Text>

          <View style={styles.profileCard}>
            {user?.photoURL && (
              <Image
                source={{ uri: user.photoURL }}
                style={styles.profileImage}
              />
            )}
            {!user?.photoURL && (
              <View
                style={[
                  styles.profileImage,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Icon name="person" size={40} color="#fff" />
              </View>
            )}

            <View style={styles.profileInfo}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {t('email')}
              </Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user?.email}
              </Text>

              <Text
                style={[
                  styles.label,
                  { color: colors.textSecondary, marginTop: 12 },
                ]}
              >
                {t('displayName')}
              </Text>

              {editMode ? (
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: colors.primary, color: colors.text },
                  ]}
                  placeholder="Enter display name"
                  placeholderTextColor={colors.textSecondary}
                  value={displayName}
                  onChangeText={setDisplayName}
                  editable={!isLoading}
                />
              ) : (
                <Text style={[styles.value, { color: colors.text }]}>
                  {user?.displayName || 'Not set'}
                </Text>
              )}
            </View>
          </View>

          {editMode ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={handleSaveName}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.error }]}
                onPress={() => {
                  setEditMode(false);
                  setDisplayName(user?.displayName || '');
                }}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => setEditMode(true)}
            >
              <Text style={styles.buttonText}>{t('editProfile')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Section */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('account')}
          </Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderColor: colors.border }]}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Icon name="lock-closed" size={20} color={colors.primary} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                {t('changePassword')}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t('updatePassword')}
              </Text>
            </View>
            <Icon
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              styles.lastSettingItem,
              { borderColor: colors.border },
            ]}
            onPress={() => {
              Alert.alert('Delete Account', 'Coming soon', [
                { text: 'OK', style: 'cancel' },
              ]);
            }}
          >
            <Icon name="trash" size={20} color={colors.error} />
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.error }]}>
                {t('deleteAccount')}
              </Text>
              <Text
                style={[
                  styles.settingSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                {t('permanentlyDelete')}
              </Text>
            </View>
            <Icon
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  profileInfo: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginTop: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginVertical: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UserSettingsScreen;
