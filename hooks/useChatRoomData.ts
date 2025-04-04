import { useState } from 'react';
import { auth } from '~/lib/firebase-config';
import { ChatPartner, FirebaseMessage } from '~/lib/types';

interface UseChatRoomDataResult {
    messages: FirebaseMessage[];
    setMessages: React.Dispatch<React.SetStateAction<FirebaseMessage[]>>;
    chatPartner: ChatPartner | null;
    setChatPartner: React.Dispatch<React.SetStateAction<ChatPartner | null>>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    currentUser: typeof auth.currentUser;
}

const useChatRoomData = (chatId: string): UseChatRoomDataResult => {
    const [messages, setMessages] = useState<FirebaseMessage[]>([]);
    const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const currentUser = auth.currentUser;
    return {
        messages,
        setMessages,
        chatPartner,
        setChatPartner,
        loading,
        setLoading,
        error,
        setError,
        currentUser,
    };
};

export default useChatRoomData;