import { useEffect } from 'react';

import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';

const useChatPresence = (currentUser: typeof auth.currentUser, chatId: string) => {
  useEffect(() => {
    if (!currentUser || !chatId) return;
    Database.updateUserPresence(currentUser.uid, chatId, true);
    Database.setupPresenceDisconnectHandlers(currentUser.uid, chatId);
    return () => {
      Database.updateUserPresence(currentUser.uid, chatId, false);
    };
  }, [currentUser, chatId]);
};

export default useChatPresence;
