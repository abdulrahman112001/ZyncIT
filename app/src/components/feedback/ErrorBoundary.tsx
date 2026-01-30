/**
 * ErrorBoundary Component
 * Error catching component with fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING, RADIUS } from '../../theme/spacing';
import { ICON_SIZES } from '../../constants/icons';

export interface ErrorBoundaryProps {
  /** Children */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Dark mode */
  isDark?: boolean;
  /** Error callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Reset callback */
  onReset?: () => void;
  /** Show error details in development */
  showDetails?: boolean;
  /** Custom title */
  title?: string;
  /** Custom message */
  message?: string;
  /** Custom retry text */
  retryText?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render(): ReactNode {
    const {
      children,
      fallback,
      isDark = false,
      showDetails = __DEV__,
      title = 'حدث خطأ غير متوقع',
      message = 'نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى.',
      retryText = 'إعادة المحاولة',
    } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

      return (
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${colors.error}15` },
            ]}
          >
            <Icon
              name="bug-outline"
              size={ICON_SIZES['3xl']}
              color={colors.error}
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Retry Button */}
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={this.handleReset}
            activeOpacity={0.8}
          >
            <Icon name="refresh" size={ICON_SIZES.sm} color="#FFFFFF" />
            <Text style={styles.retryText}>{retryText}</Text>
          </TouchableOpacity>

          {/* Error Details (Development Only) */}
          {showDetails && error && (
            <View
              style={[
                styles.detailsContainer,
                { backgroundColor: colors.surfaceTertiary },
              ]}
            >
              <Text style={[styles.detailsTitle, { color: colors.error }]}>
                Error Details:
              </Text>
              <ScrollView
                style={styles.detailsScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={[styles.detailsText, { color: colors.textSecondary }]}
                >
                  {error.toString()}
                </Text>
                {errorInfo?.componentStack && (
                  <Text
                    style={[styles.stackText, { color: colors.textTertiary }]}
                  >
                    {errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  retryText: {
    ...TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    width: '100%',
    maxHeight: 200,
  },
  detailsTitle: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  detailsScroll: {
    maxHeight: 150,
  },
  detailsText: {
    ...TYPOGRAPHY.caption,
    fontFamily: 'monospace',
  },
  stackText: {
    ...TYPOGRAPHY.small,
    fontFamily: 'monospace',
    marginTop: SPACING.sm,
  },
});

export default ErrorBoundary;
