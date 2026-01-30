import { AppNotification } from '../../../services/notificationService';

export interface GroupedNotification {
  key: string;
  title: string;
  appName: string;
  type: string;
  lastText: string;
  lastTimestamp: number;
  count: number;
  unreadCount: number;
  notifications: AppNotification[];
  phoneNumber?: string;
  packageName?: string;
  appIcon?: string;
}

export interface SwipeableItemProps {
  item: GroupedNotification;
  onPress: () => void;
  onDelete: () => void;
  onMute: () => void;
  isRTL: boolean;
  colors: any;
  isDarkMode: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}
