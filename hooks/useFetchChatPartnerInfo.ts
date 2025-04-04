import React, { useEffect } from 'react';

import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';
import { ChatPartner } from '~/lib/types';

const useFetchChatPartner = (
    chatId: string,
    currentUser: typeof auth.currentUser,
    setChatPartner: React.Dispatch<React.SetStateAction<ChatPartner | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
    useEffect(() => {
        if (!chatId || !currentUser) {
            setError('Chat ID or user missing.');
            setLoading(false);
            return;
        }
        const unsubscribe = Database.fetchChatPartnerInfo(
            chatId,
            currentUser.uid,
            setChatPartner,
            setLoading,
            setError
        );
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [chatId, currentUser, setChatPartner, setLoading, setError]);
};

export default useFetchChatPartner;
