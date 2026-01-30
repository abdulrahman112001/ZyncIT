/**
 * RefreshableList Component
 * FlatList wrapper with pull-to-refresh and empty state
 */

import React, { useCallback, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  View,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  ListRenderItem,
} from 'react-native';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';
import { SPACING } from '../../theme/spacing';
import EmptyState from '../shared/EmptyState';

export interface RefreshableListProps<T>
  extends Omit<FlatListProps<T>, 'renderItem' | 'data'> {
  /** List data */
  data: T[];
  /** Render item function */
  renderItem: ListRenderItem<T>;
  /** Key extractor */
  keyExtractor: (item: T, index: number) => string;
  /** Refresh handler */
  onRefresh?: () => Promise<void>;
  /** Load more handler */
  onLoadMore?: () => Promise<void>;
  /** Loading state */
  loading?: boolean;
  /** Refreshing state (controlled) */
  refreshing?: boolean;
  /** Dark mode */
  isDark?: boolean;
  /** Empty state icon */
  emptyIcon?: string;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state subtitle */
  emptySubtitle?: string;
  /** Empty state action */
  emptyAction?: {
    text: string;
    onPress: () => void;
  };
  /** Show empty state */
  showEmptyState?: boolean;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Loading more indicator */
  loadingMore?: boolean;
  /** Custom empty component */
  emptyComponent?: React.ReactNode;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Header component */
  headerComponent?: React.ComponentType<any> | React.ReactElement | null;
  /** Footer component */
  footerComponent?: React.ReactNode;
}

function RefreshableList<T>({
  data,
  renderItem,
  keyExtractor,
  onRefresh,
  onLoadMore,
  loading = false,
  refreshing: controlledRefreshing,
  isDark = false,
  emptyIcon = 'document-text-outline',
  emptyTitle = 'لا توجد بيانات',
  emptySubtitle,
  emptyAction,
  showEmptyState = true,
  containerStyle,
  loadingMore = false,
  emptyComponent,
  loadingComponent,
  headerComponent,
  footerComponent,
  ...flatListProps
}: RefreshableListProps<T>): React.ReactElement {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const [internalRefreshing, setInternalRefreshing] = useState(false);

  const isRefreshing = controlledRefreshing ?? internalRefreshing;

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;

    setInternalRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setInternalRefreshing(false);
    }
  }, [onRefresh]);

  const handleEndReached = useCallback(() => {
    if (loadingMore || loading || !onLoadMore) return;
    onLoadMore();
  }, [loadingMore, loading, onLoadMore]);

  const renderFooter = useCallback(() => {
    if (footerComponent) {
      return (
        <View>
          {footerComponent}
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    return null;
  }, [footerComponent, loadingMore, colors.primary]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      if (loadingComponent) {
        return <>{loadingComponent}</>;
      }
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!showEmptyState) return null;

    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }

    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        subtitle={emptySubtitle}
        actionButton={emptyAction}
        isDarkMode={isDark}
      />
    );
  }, [
    loading,
    loadingComponent,
    showEmptyState,
    emptyComponent,
    emptyIcon,
    emptyTitle,
    emptySubtitle,
    emptyAction,
    isDark,
    colors.primary,
  ]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.contentContainer,
        data.length === 0 && styles.emptyContentContainer,
        containerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      {...flatListProps}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyContentContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingMoreContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
});

export default RefreshableList;
