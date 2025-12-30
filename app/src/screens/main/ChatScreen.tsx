import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ChatScreen = () => {
  const { colors, t } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.icon}>💭</Text>
      <Text style={[styles.title, { color: colors.text }]}>{t('chat')}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Chat with your devices
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});

export default ChatScreen;
