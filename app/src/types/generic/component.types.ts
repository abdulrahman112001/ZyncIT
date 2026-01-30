/**
 * Component Props Generic Types
 */

/**
 * List component props
 */
export interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  onItemPress?: (item: T) => void;
  emptyComponent?: React.ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
}

/**
 * Selectable list props
 */
export interface SelectableListProps<T> extends ListProps<T> {
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  selectionMode: 'single' | 'multiple';
}

/**
 * Form input props
 */
export interface FormInputProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}
