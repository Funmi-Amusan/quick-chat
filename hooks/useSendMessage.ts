import { useMutation } from '@tanstack/react-query';
import { User } from 'firebase/auth';
import { useCallback, useRef, useState } from 'react';

import { PickedFile } from '~/components/chats/modals/FilePreviewModal';
import * as Database from '~/lib/firebase-sevice';
import { ReplyMessageInfo } from '~/lib/types';

export default function useSendMessage(
  chatId: string | null,
  currentUser: User | null,
  setImageUri: (value: string | null) => void,
  imageUri: string | null,
  setFile: (value: PickedFile | null) => void,
  file: PickedFile | null
) {
  const [inputText, setInputText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [replyMessage, setReplyMessage] = useState<ReplyMessageInfo | null>(null);
  const typingTimeoutRef = useRef(null);

  const handleUploadProgress = useCallback((progress: number) => {
    setProgress(progress);
    console.log('Upload progress:', progress);
  }, []);

  const {
    mutate: sendMessageMutate,
    isPending: isSendingMessage,
    error: sendMessageError,
  } = useMutation({
    mutationFn: async (params: {
      text: string;
      imageUriToSend: string | null;
      fileToSend: PickedFile | null;
    }) => {
      const { text, imageUriToSend, fileToSend } = params;
      if (!currentUser || !chatId) {
        throw new Error('User or Chat ID missing.');
      }
      setInputText('');
      if (fileToSend) {
        Database.sendFileMessage(
          chatId,
          currentUser.uid,
          fileToSend,
          text,
          replyMessage,
          handleUploadProgress
        );
        setReplyMessage(null);
        setFile(null);
      }
      if (imageUriToSend) {
        Database.sendImageMessage(chatId, currentUser.uid, imageUriToSend, text, replyMessage);
        setReplyMessage(null);
        setImageUri(null);
      } else if (text) {
        Database.sendMessage(chatId, currentUser.uid, text, replyMessage);
        setReplyMessage(null);
      } else {
        throw new Error('Cannot send empty message.');
      }
    },
    onSuccess: (data, variables) => {
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
    if ((!trimmedInput && !imageUri && !file) || !currentUser || !chatId) {
      return;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    Database.resetTypingStatus(currentUser.uid, chatId);
    sendMessageMutate({ text: trimmedInput, imageUriToSend: imageUri, fileToSend: file });
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
    progress,
  };
}
