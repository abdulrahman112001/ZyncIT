import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SelectableHeaderProps } from './types';

/**
 * A reusable header component for screens with select/edit mode functionality
 * Used in: NotificationsScreen, CallsScreen, SMSScreen, etc.
 */
const SelectableHeader: React.FC<SelectableHeaderProps> = ({
  isSelectMode,
  selectedCount,
  totalCount,
  onCancel,
  onSelectAll,
  onEnterSelectMode,
  isRTL = false,
  isDarkMode = false,
  selectText,
  cancelText,
  selectAllText,
  deselectAllText,
}) => {
  const bgColor = isDarkMode ? '#000000' : '#FFFFFF';

  const getSelectText = () => selectText || (isRTL ? 'تحديد' : 'Select');
  const getCancelText = () => cancelText || (isRTL ? 'إلغاء' : 'Cancel');
  const getSelectAllText = () =>
    selectAllText || (isRTL ? 'تحديد الكل' : 'Select All');
  const getDeselectAllText = () =>
    deselectAllText || (isRTL ? 'إلغاء تحديد الكل' : 'Deselect All');

  if (isSelectMode) {
    return (
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        {isRTL ? (
          <>
            <TouchableOpacity onPress={onSelectAll}>
              <Text style={styles.headerButtonText}>
                {selectedCount === totalCount
                  ? getDeselectAllText()
                  : getSelectAllText()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.headerButtonText}>{getCancelText()}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.headerButtonText}>{getCancelText()}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSelectAll}>
              <Text style={styles.headerButtonText}>
                {selectedCount === totalCount
                  ? getDeselectAllText()
                  : getSelectAllText()}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.header, { backgroundColor: bgColor }]}>
      {isRTL ? (
        <>
          <TouchableOpacity onPress={onEnterSelectMode}>
            <Text style={styles.headerButtonText}>{getSelectText()}</Text>
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </>
      ) : (
        <>
          <View style={styles.headerSpacer} />
          <TouchableOpacity onPress={onEnterSelectMode}>
            <Text style={styles.headerButtonText}>{getSelectText()}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  headerSpacer: {
    width: 36,
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#D5C19E',
  },
});

export default SelectableHeader;
