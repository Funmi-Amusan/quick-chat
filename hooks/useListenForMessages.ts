import { router } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import Toast from 'react-native-toast-message';

import { NotificationData, useNotification } from '~/context/NotificationContext';
import { auth } from '~/lib/firebase-config';
import {
  fetchInitialMessages,
  fetchOlderMessages,
  listenForNewMessages,
} from '~/lib/firebase-sevice';
import { ChatPartner, FirebaseMessage } from '~/lib/types';

interface UseListenForChatMessagesProps {
  chatId: string;
  currentUser: typeof auth.currentUser;
  setMessages: React.Dispatch<React.SetStateAction<FirebaseMessage[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  chatPartner: ChatPartner | undefined;
  batchSize?: number;
}

const useListenForChatMessages = ({
  chatId,
  currentUser,
  setMessages,
  setLoading,
  setError,
  chatPartner,
  batchSize = 50,
}: UseListenForChatMessagesProps) => {
  const { scheduleNotification } = useNotification();
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);

  const sendNotification = useCallback(
    (message: FirebaseMessage) => {
      console.log('chatPartner before sending notif', chatPartner);
      if (chatPartner && chatPartner.isActive === true) {
        Toast.show({
          type: 'info',
          text1: `🔔 New message from ${chatPartner.username}`,
          text2: message.content
            ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
            : 'Image/other content',
          onPress: () => {
            router.push(`/chatroom/${chatId}`);
          },
        });
      } else if (chatPartner && chatPartner.isActive === false) {
        const messageRecievedNotificationData: NotificationData = {
          title: 'New Message',
          body: '🔔 You have a new message from ' + chatPartner.username,
          date: null,
          identifier: `new-message-${chatId}-${message.id}`,
          otherData: {
            type: 'new-message',
            chatId,
          },
        };
        scheduleNotification(messageRecievedNotificationData, () => {
          router.push(`/chatroom/${chatId}`);
        });
      }
    },
    [chatPartner, chatId, scheduleNotification]
  );
  const setupListeners = useCallback(async () => {
    if (!chatId || !currentUser) {
      setError('Chat ID or currentUser is missing.');
      setLoading(false);
      return () => {};
    }
    setLoading(true);
    setError(null);
    setHasMoreMessages(true);

    try {
      const initialMessagesList = await fetchInitialMessages(chatId);
      if (initialMessagesList.length > 0) {
        initialMessagesList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(initialMessagesList);
        setOldestTimestamp(initialMessagesList[0].timestamp);
        if (initialMessagesList.length < batchSize) {
          setHasMoreMessages(false);
        }
        const latestTimestamp = initialMessagesList[initialMessagesList.length - 1].timestamp;
        listenForNewMessages(
          chatId,
          latestTimestamp,
          (newMessage) => {
            setMessages((prevMessages) => {
              if (!prevMessages.some((msg) => msg.id === newMessage.id)) {
                return [...prevMessages, newMessage];
              }
              return prevMessages;
            });
          },
          (err) => {
            console.error('Error in new messages listener:', err);
          }
        );
      } else {
        setMessages([]);
        console.log('0----');
        setHasMoreMessages(false);
      }
    } catch (err: any) {
      console.error('Error during initial setup:', err);
      setError(err.message || 'Failed to load messages.');
      setHasMoreMessages(false);
    } finally {
      setLoading(false);
    }

    return () => {};
  }, [chatId, currentUser, setMessages, setLoading, setError, batchSize, sendNotification]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreMessages || !chatId || !currentUser) {
      return;
    }

    setLoadingOlder(true);
    setError(null);

    if (oldestTimestamp === null) {
      setLoadingOlder(false);
      setHasMoreMessages(false);
      return;
      // return an error?
    }

    try {
      const olderMessages = await fetchOlderMessages(chatId, oldestTimestamp, batchSize);

      if (olderMessages.length > 0) {
        olderMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages((prevMessages) => [...olderMessages, ...prevMessages]);
        if (olderMessages.length < batchSize) {
          console.log('setting hasMoreMessages to false');
          setHasMoreMessages(false);
        }
      } else {
        setHasMoreMessages(false);
      }
    } catch (err: any) {
      console.error('Error loading older messages:', err);
      setError(err.message || 'Failed to load older messages.');
      setHasMoreMessages(false);
    } finally {
      setLoadingOlder(false);
    }
  }, [chatId, currentUser, batchSize, loadingOlder, hasMoreMessages, setMessages, setError]);

  useEffect(() => {
    const cleanup = setupListeners();
    return () => {
      console.log('cleanup');
    };
  }, [setupListeners]);

  return {
    loadingOlder,
    hasMoreMessages,
    loadOlderMessages,
  };
};

export default useListenForChatMessages;
