import { User } from 'firebase/auth';
import { useEffect, useRef } from 'react';

import * as Database from '~/lib/firebase-sevice';

const useTypingStatus = (currentUser: User | null, chatId: string, inputText: string) => {
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (!currentUser || !chatId) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        if (inputText.trim() !== '') {
            Database.setTypingStatus(currentUser.uid, chatId, true);
            typingTimeoutRef.current = setTimeout(() => {
                Database.resetTypingStatus(currentUser.uid, chatId);
                typingTimeoutRef.current = null;
            }, 5000);
        } else {
            Database.resetTypingStatus(currentUser.uid, chatId);
        }

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [inputText, currentUser, chatId]);
};

export default useTypingStatus;
