import { useMutation } from '@tanstack/react-query';
import { User } from 'firebase/auth';
import { useCallback, useRef, useState } from 'react';

import * as Database from '~/lib/firebase-sevice';
import { ReplyMessageInfo } from '~/lib/types';

export default function useSendMessage(
  chatId: string | null,
  currentUser: User | null,
  setImageUri: (value: string | null) => void,
  imageUri: string | null
) {
  const [inputText, setInputText] = useState<string>('');
  const [replyMessage, setReplyMessage] = useState<ReplyMessageInfo | null>(null);
  const typingTimeoutRef = useRef(null);

  const {
    mutate: sendMessageMutate,
    isPending: isSendingMessage,
    error: sendMessageError,
  } = useMutation({
    mutationFn: async (params: { text: string; imageUriToSend: string | null }) => {
      const { text, imageUriToSend } = params;
      if (!currentUser || !chatId) {
        throw new Error('User or Chat ID missing.');
      }
      setInputText('');
      if (imageUriToSend) {
        await Database.sendImageMessage(
          chatId,
          currentUser.uid,
          imageUriToSend,
          text,
          replyMessage
        );
      } else if (text) {
        await Database.sendMessage(chatId, currentUser.uid, text, replyMessage);
      } else {
        throw new Error('Cannot send empty message.');
      }
    },
    onSuccess: (data, variables) => {
      setReplyMessage(null);
      setImageUri(null);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (currentUser && chatId) {
        Database.resetTypingStatus(currentUser.uid, chatId);
      }
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
    },
  });

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputText.trim();
    if ((!trimmedInput && !imageUri) || !currentUser || !chatId) {
      return;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    Database.resetTypingStatus(currentUser.uid, chatId);
    sendMessageMutate({ text: trimmedInput, imageUriToSend: imageUri });
  }, [inputText, imageUri, currentUser, chatId, replyMessage, sendMessageMutate]);

  return {
    inputText,
    setInputText,
    replyMessage,
    setReplyMessage,
    isSendingMessage,
    sendMessageError,
    handleSendMessage,
    typingTimeoutRef,
  };
}
