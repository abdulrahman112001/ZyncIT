import { StyleProp, ViewStyle, TextStyle } from 'react-native';

// SearchBar Types
export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isRTL?: boolean;
  isDarkMode?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

// EmptyState Types
export interface EmptyStateProps {
  icon?: string;
  iconComponent?: React.ReactNode;
  title: string;
  subtitle?: string;
  actionButton?: {
    text: string;
    onPress: () => void;
  };
  isLoading?: boolean;
  loadingText?: string;
  isDarkMode?: boolean;
}

// SelectableHeader Types
export interface SelectableHeaderProps {
  isSelectMode: boolean;
  selectedCount: number;
  totalCount: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onEnterSelectMode: () => void;
  isRTL?: boolean;
  isDarkMode?: boolean;
  selectText?: string;
  cancelText?: string;
  selectAllText?: string;
  deselectAllText?: string;
}

// ScreenTitle Types
export interface ScreenTitleProps {
  title: string;
  isDarkMode?: boolean;
  rightComponent?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

// Alert Types
export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface ConfirmDeleteOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  isRTL?: boolean;
}

export interface MuteAlertOptions {
  itemName: string;
  isRTL?: boolean;
}

export interface PermissionAlertOptions {
  title: string;
  message: string;
  onOpenSettings: () => void;
  cancelText?: string;
  settingsText?: string;
}

export interface MiuiPermissionAlertOptions {
  onAutoStartSettings: () => void;
  onNotificationSettings: () => void;
  laterText?: string;
}
