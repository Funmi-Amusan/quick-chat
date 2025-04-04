import { useEffect } from 'react';

import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';
import { FirebaseMessage } from '~/lib/types';

const useMarkMessagesAsRead = (
    currentUser: typeof auth.currentUser,
    chatId: string,
    messages: FirebaseMessage[]
) => {
    useEffect(() => {
        if (!currentUser || !chatId || !messages.length) return;
        Database.markMessagesAsRead(chatId, currentUser.uid, messages);
    }, [messages, currentUser, chatId]);
};

export default useMarkMessagesAsRead;
