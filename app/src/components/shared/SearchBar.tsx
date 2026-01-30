import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SearchBarProps } from './types';

/**
 * A reusable search bar component with iOS-style design
 * Used in: NotificationsScreen, CallsScreen, SMSScreen, etc.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder,
  isRTL = false,
  isDarkMode = false,
  containerStyle,
}) => {
  const bgColor = isDarkMode ? '#2C2C2E' : '#E5E5EA';
  const borderColor = isDarkMode ? '#3A3A3C' : '#D1D1D6';
  const iconColor = isDarkMode ? '#EBEBF5' : '#3C3C43';
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const placeholderColor = isDarkMode ? '#EBEBF599' : '#3C3C4399';

  const defaultPlaceholder = isRTL ? 'بحث...' : 'Search...';

  return (
    <View style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={iconColor}
          style={[styles.searchIcon, isRTL && styles.searchIconRTL]}
        />
        <TextInput
          style={[styles.input, { color: textColor }, isRTL && styles.inputRTL]}
          placeholder={placeholder || defaultPlaceholder}
          placeholderTextColor={placeholderColor}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')}>
            <Ionicons name="close-circle" size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 36,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchIconRTL: {
    marginRight: 0,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  inputRTL: {
    textAlign: 'right',
  },
});

export default SearchBar;
