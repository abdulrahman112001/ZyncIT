import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../../store/authStore';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const AccountScreen = () => {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="person-circle" size={80} color={COLORS.primary} />
        <Text style={styles.email}>{user?.email || 'No email'}</Text>
      </View>
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Icon name="log-out-outline" size={24} color={COLORS.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  email: { fontFamily: FONTS.medium, fontSize: 18, color: COLORS.text, marginTop: SPACING.md },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md },
  signOutText: { fontFamily: FONTS.medium, fontSize: 16, color: COLORS.error, marginLeft: SPACING.sm },
});

export default AccountScreen;
