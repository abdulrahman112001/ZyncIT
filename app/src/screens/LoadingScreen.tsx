import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const LoadingScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.logoContainer}>
        <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
          <Text style={styles.logoText}>Z</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>IRopit</Text>
      </View>
      <ActivityIndicator
        size="large"
        color={colors.primary}
        style={styles.loader}
      />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        Loading...
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
  },
});

export default LoadingScreen;
