import React from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  SelectableHeader,
  ScreenTitle,
  SearchBar,
  EmptyState,
} from '../../../components/shared';
import { styles } from './styles';
import { GroupedCall } from './types';
import SwipeableCallItem from './components/SwipeableCallItem';
import { useCallsScreen } from './useCallsScreen';

/**
 * CallsScreen - Displays grouped call logs
 * UI-only component - all business logic is handled by useCallsScreen hook
 */
const CallsScreen = () => {
  const {
    // Data
    groupedCalls,
    calls,
    searchQuery,
    isSelectMode,
    selectedCalls,
    isLoading,

    // Theme
    isRTL,
    isDarkMode,
    bgColor,
    textColor,
    secondaryTextColor,
    avatarBgColor,

    // Handlers
    setSearchQuery,
    handlePress,
    handleDelete,
    toggleSelectCall,
    toggleSelectAll,
    handleDeleteSelected,
    handleDeleteAllCalls,
    cancelSelectMode,
    enterSelectMode,
    loadCalls,
  } = useCallsScreen();

  const renderItem = ({ item }: { item: GroupedCall }) => (
    <SwipeableCallItem
      item={item}
      onPress={() => handlePress(item)}
      onDelete={() => handleDelete(item)}
      isRTL={isRTL}
      isDarkMode={isDarkMode}
      textColor={textColor}
      secondaryTextColor={secondaryTextColor}
      bgColor={bgColor}
      avatarBgColor={avatarBgColor}
      isSelectMode={isSelectMode}
      isSelected={selectedCalls.includes(item.phoneNumber)}
      onToggleSelect={() => toggleSelectCall(item.phoneNumber)}
    />
  );

  const renderDeleteAllButton = () => (
    <TouchableOpacity
      onPress={handleDeleteAllCalls}
      style={styles.deleteAllButton}
    >
      <Ionicons name="trash-outline" size={22} color="#FF3B30" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="📞"
      title={isRTL ? 'لا توجد مكالمات' : 'No Calls'}
      subtitle={
        isRTL
          ? 'المكالمات الجديدة ستظهر هنا بعد حدوثها'
          : 'New calls will appear here after they occur'
      }
      isDarkMode={isDarkMode}
    />
  );

  // Show loading indicator on initial load
  if (isLoading && calls.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={bgColor}
        />
        <SelectableHeader
          isSelectMode={isSelectMode}
          selectedCount={selectedCalls.length}
          totalCount={groupedCalls.length}
          onCancel={cancelSelectMode}
          onSelectAll={toggleSelectAll}
          onEnterSelectMode={enterSelectMode}
          isRTL={isRTL}
          isDarkMode={isDarkMode}
        />
        <ScreenTitle
          title={isRTL ? 'المكالمات' : 'Calls'}
          isDarkMode={isDarkMode}
          isRTL={isRTL}
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

      {/* Header with Select/Cancel buttons */}
      <SelectableHeader
        isSelectMode={isSelectMode}
        selectedCount={selectedCalls.length}
        totalCount={groupedCalls.length}
        onCancel={cancelSelectMode}
        onSelectAll={toggleSelectAll}
        onEnterSelectMode={enterSelectMode}
        isRTL={isRTL}
        isDarkMode={isDarkMode}
      />

      {/* Screen Title with Delete button */}
      <ScreenTitle
        title={isRTL ? 'المكالمات' : 'Calls'}
        isDarkMode={isDarkMode}
        isSelectMode={isSelectMode}
        selectedCount={selectedCalls.length}
        onDeleteSelected={handleDeleteSelected}
        isRTL={isRTL}
        rightComponent={!isSelectMode ? renderDeleteAllButton() : undefined}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        isRTL={isRTL}
        isDarkMode={isDarkMode}
      />

      {/* Calls List */}
      <FlatList
        data={groupedCalls}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadCalls}
            tintColor="#0A84FF"
          />
        }
      />
    </View>
  );
};

export default CallsScreen;
