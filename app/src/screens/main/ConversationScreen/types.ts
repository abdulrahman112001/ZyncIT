import { AppNotification } from '../../../services/notificationService';

export interface ConversationScreenProps {
  route: {
    params: {
      title: string;
      appName: string;
      type: string;
      phoneNumber?: string;
      notifications: AppNotification[];
    };
  };
  navigation: any;
}

export interface MessageBubbleProps {
  item: AppNotification;
  onDelete: (id: string) => void;
  isRTL: boolean;
  textColor: string;
  secondaryTextColor: string;
  bubbleColor: string;
  bgColor: string;
}
