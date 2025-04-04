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
    createdAt: string;
    id: string;
    participants: string[];
    partner: string;
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
}

export interface ChatPartner {
    id: string;
    username: string;
    isActive: boolean;
    isTyping: boolean;
    lastActive: number | null;
}