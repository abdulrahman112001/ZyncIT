export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
  };
  timestamp: number;
  read: boolean;
}
