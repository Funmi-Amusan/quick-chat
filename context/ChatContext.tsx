import { User } from 'firebase/auth';
import { Unsubscribe } from 'firebase/database';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { listenToUserChats } from '~/lib/firebase-sevice';

import { ChatData } from '~/lib/types';

interface ChatContextType {
  userChats: ChatData[];
  loading: boolean;
  error: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: User | undefined;
}) => {
  const [userChats, setUserChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = React.useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!currentUser) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        console.log('Unsubscribed on user logout.');
      }
      setUserChats([]);
      setLoading(false);
      setError('User not authenticated for chat listening.');
      return;
    }

    setLoading(true);
    setError(null);

    // Set up the listener
    const unsubscribe = listenToUserChats(currentUser.uid, (chatsFromService, serviceError) => {
      if (serviceError) {
        console.error('Error from global chat listener:', serviceError);
        setError(serviceError.message || 'Failed to load chats globally.');
        setUserChats([]);
      } else {
        setUserChats(chatsFromService);
        setError(null);
      }
      setLoading(false);
    });

    unsubscribeRef.current = unsubscribe;
    return () => {};
  }, [currentUser]);

  return (
    <ChatContext.Provider value={{ userChats, loading, error }}>{children}</ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
