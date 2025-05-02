export type ChatType = {
  id: number;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  avatar: string;
  isOnline: boolean;
  isTyping: boolean;
  messages: {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  };
};

export interface ChatData {
  id: string;
  partner: string;
  lastMessage: LastMessageData;
  partnerId: string;
  updatedAt: number;
}

export interface LastMessageData {
  content: string;
  senderId: string;
  timestamp: number;
  messageType: string;
  read: boolean;
}

export interface UserData {
  id: string;
  email: string;
  username: string;
  chats: ChatData[];
}

export interface FormattedUser {
  id: string;
  email: string;
  username: string;
}

export interface FormattedChat {
  id: string;
  email: string;
  username: string;
}

export interface FirebaseMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  read: boolean;
  reaction: string;
  replyMessage: ReplyMessageInfo | null;
  imageUrl: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileName: string | null;
  status?: 'pending' | 'sent' | 'failed';
  uploadProgress?: number; 
}

export interface ChatPartner {
  id: string;
  username: string;
  isActive: boolean;
  isTyping: isTyping;
  isLoggedIn: boolean;
  lastActive: number | null;
}

export interface isTyping {
  isTyping: boolean;
}

export interface ReplyMessageInfo {
  id: string;
  content: string;
  senderId: string;
  imageUrl: string | null;
  fileName: any | null;
}

export type DateHeaderMessage = {
  type: string;
  date: string;
  id: string;
};

export type ActualMessage = FirebaseMessage & {
  type: 'message';
};

export type ProcessedMessage = DateHeaderMessage | ActualMessage;
