export interface SMSScreenProps {
  navigation?: any;
}

export interface Conversation {
  phoneNumber: string;
  contactName?: string;
  messages: any[];
  lastMessage: any;
  unreadCount: number;
}
