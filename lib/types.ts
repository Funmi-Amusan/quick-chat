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
