import React from 'react';
import { View, FlatList, RefreshControl, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../contexts/ThemeContext';

import {
  SelectableHeader,
  ScreenTitle,
  SearchBar,
  EmptyState,
} from '../../../components/shared';

import { GroupedNotification } from './types';
import { styles } from './styles';
import SwipeableItem from './components/SwipeableItem';
import { useNotificationsScreen } from './useNotificationsScreen';

const NotificationsScreen = () => {
  const { t } = useTheme();
  const {
    // Data
    groupedNotifications,
    searchQuery,
    isSelectMode,
    selectedNotifications,
    isLoading,
    initialLoading,
    hasPermission,

    // Theme
    isRTL,
    isDarkMode,
    colors,
    bgColor,

    // Handlers
    setSearchQuery,
    handlePress,
    handleDelete,
    handleMute,
    toggleSelectNotification,
    toggleSelectAll,
    handleDeleteSelected,
    cancelSelectMode,
    enterSelectMode,
    checkPermission,
    requestPermission,
  } = useNotificationsScreen('notifications-only');

  const renderItem = ({ item }: { item: GroupedNotification }) => (
    <SwipeableItem
      item={item}
      onPress={() => handlePress(item)}
      onDelete={() => handleDelete(item)}
      onMute={() => handleMute(item)}
      isRTL={isRTL}
      colors={colors}
      isDarkMode={isDarkMode}
      isSelectMode={isSelectMode}
      isSelected={selectedNotifications.includes(item.key)}
      onToggleSelect={() => toggleSelectNotification(item.key)}
    />
  );

  const renderEmptyState = () => {
    if (initialLoading) {
      return (
        <EmptyState
          icon="hourglass-outline"
          title={t('loading')}
          isDarkMode={isDarkMode}
          isLoading={true}
          loadingText={t('loading')}
        />
      );
    }

    if (!hasPermission) {
      return (
        <EmptyState
          iconComponent={
            <Ionicons
              name="notifications-outline"
              size={64}
              color={colors.primary}
              style={{ marginBottom: 16 }}
            />
          }
          title={t('enableNotificationAccess')}
          subtitle={t('notificationPermissionDesc')}
          actionButton={{
            text: t('enableAccess'),
            onPress: requestPermission,
          }}
          isDarkMode={isDarkMode}
        />
      );
    }

    return (
      <EmptyState
        icon="📭"
        title={t('noMessagesYet')}
        subtitle={t('messagesWillAppear')}
        isDarkMode={isDarkMode}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={bgColor}
      />

      {/* Header with Select/Cancel buttons */}
      <SelectableHeader
        isSelectMode={isSelectMode}
        selectedCount={selectedNotifications.length}
        totalCount={groupedNotifications.length}
        onCancel={cancelSelectMode}
        onSelectAll={toggleSelectAll}
        onEnterSelectMode={enterSelectMode}
        isRTL={isRTL}
        isDarkMode={isDarkMode}
      />

      {/* Screen Title with Delete button in select mode */}
      <ScreenTitle
        title={t('notifications')}
        isDarkMode={isDarkMode}
        isSelectMode={isSelectMode}
        selectedCount={selectedNotifications.length}
        onDeleteSelected={handleDeleteSelected}
        isRTL={isRTL}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        isRTL={isRTL}
        isDarkMode={isDarkMode}
      />

      {/* Notifications List */}
      <FlatList
        data={groupedNotifications}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={checkPermission}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

export default NotificationsScreen;
