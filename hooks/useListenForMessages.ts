import { router } from 'expo-router';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';

import { NotificationData, useNotification } from '~/context/NotificationContext';
import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';
import { ChatPartner, FirebaseMessage } from '~/lib/types';

interface UseListenForChatMessagesProps {
    chatId: string;
    currentUser: typeof auth.currentUser;
    setMessages: React.Dispatch<React.SetStateAction<FirebaseMessage[]>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    chatPartner: ChatPartner | null;
}

const useListenForChatMessages = ({
    chatId,
    currentUser,
    setMessages,
    setLoading,
    setError,
    chatPartner,
}: UseListenForChatMessagesProps) => {
    const { scheduleNotification } = useNotification();

    useEffect(() => {
        if (!chatId) {
            setError('Chat ID is missing.');
            setLoading(false);
            return;
        }
        if (!currentUser) {
            setError('currentUser is missing.');
            setLoading(false);
            return;
        }

        const sendNotification = () => {
            console.log('chatPartner before sending notif', chatPartner);
            if (chatPartner && chatPartner.isActive === true) {
                console.log('show toast');
                return Toast.show({
                    type: 'info',
                    text1: `🔔 You have a new message from ${chatPartner}`,
                });
            } else if (chatPartner && chatPartner.isActive === false) {
                const messageRecievedNotificationData: NotificationData = {
                    title: 'New Message',
                    body: '🔔 You have a new message from ' + chatPartner.username,
                    date: null,
                    identifier: `new-message-${chatId}`,
                    otherData: {
                        type: 'new-message',
                        chatId,
                    },
                };
                scheduleNotification(messageRecievedNotificationData, () => {
                    router.push(`/chatroom/${chatId}`);
                });
            }
        };

        Database.listenForMessages(
            chatId,
            currentUser.uid,
            setMessages,
            setLoading,
            setError,
            sendNotification
        );
    }, [
        chatId,
        currentUser,
        setMessages,
        setLoading,
        setError,
        chatPartner,
        scheduleNotification,
        router,
    ]);
};

export default useListenForChatMessages;
