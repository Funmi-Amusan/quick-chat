import { useMutation } from '@tanstack/react-query';
import { User } from 'firebase/auth';
import { useCallback, useRef, useState, useEffect } from 'react';

import { PickedFile } from '~/components/chats/modals/FilePreviewModal';
import * as Database from '~/lib/firebase-sevice';
import { FirebaseMessage, ReplyMessageInfo } from '~/lib/types';

export default function useSendMessage(
  chatId: string | null,
  currentUser: User | null,
  setImageUri: (value: string | null) => void,
  imageUri: string | null,
  setFile: (value: PickedFile | null) => void,
  file: PickedFile | null,
  setMessages: (value: FirebaseMessage[]) => void
) {
  const [inputText, setInputText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [replyMessage, setReplyMessage] = useState<ReplyMessageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
        if (currentUser && chatId) {
          Database.resetTypingStatus(currentUser.uid, chatId);
        }
      }
    };
  }, [currentUser, chatId]);

  const createOptimisticMessage = useCallback(
    (text: string): FirebaseMessage => {
      if (!currentUser || !chatId) {
        throw new Error('User or Chat ID missing.');
      }

      const timestamp = Date.now();
      lastSentTimestampRef.current = timestamp;
      const tempId = timestamp.toString();

      return {
        id: tempId, 
        tempId, 
        senderId: currentUser.uid,
        content: text.trim(),
        timestamp,
        read: false,
        reaction: '',
        replyMessage,
        imageUrl: imageUri,
        fileUrl: file?.uri,
        fileType: file?.type,
        fileName: file?.name,
        status: 'pending',
        uploadProgress: progress,
      };
    },
    [chatId, currentUser, file, imageUri, replyMessage, progress]
  );

  const updateMessageStatus = useCallback(
    (tempId: string, status: 'pending' | 'sent' | 'error', errorMessage?: string) => {
     
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id === tempId) {
            return {
              ...msg,
              status,
              errorMessage,
              uploadProgress: status === 'sent' ? 100 : msg.uploadProgress,
            };
          }
          return msg;
        })
      );
    },
    [setMessages]
  );

  const updateMessageProgress = useCallback(
    (tempId: string, uploadProgress: number) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === tempId ? { ...msg, uploadProgress } : msg))
      );
    },
    [setMessages]
  );

  const updateTypingStatus = useCallback(
    (text: string) => {
      if (!currentUser || !chatId) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (text.trim()) {
        Database.setTypingStatus(currentUser.uid, chatId, true);
        typingTimeoutRef.current = setTimeout(() => {
          Database.resetTypingStatus(currentUser.uid, chatId);
          typingTimeoutRef.current = null;
        }, 5000);
      } else {
        Database.resetTypingStatus(currentUser.uid, chatId);
        typingTimeoutRef.current = null;
      }
    },
    [currentUser, chatId]
  );

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);
      updateTypingStatus(text);
    },
    [updateTypingStatus]
  );

  const {
    mutate: sendMessageMutate,
    isPending: isSendingMessage,
    error: sendMessageError,
    reset: resetMutation,
  } = useMutation({
    mutationFn: async (params: {
      text: string;
      imageUriToSend: string | null;
      fileToSend: PickedFile | null;
      tempId: string;
    }) => {
      setError(null);
      const { text, imageUriToSend, fileToSend, tempId } = params;

      if (!currentUser || !chatId) {
        throw new Error('User or Chat ID missing.');
      }

      try {
        let messageId: string | null = null;

        if (fileToSend) {
          setFile(null);
          messageId = await Database.sendFileMessage(
            chatId,
            currentUser.uid,
            fileToSend,
            text,
            replyMessage,
            (uploadProgress) => {
              updateMessageProgress(tempId, uploadProgress);
              setUploading(uploadProgress < 100);
            }
          );
        } else if (imageUriToSend) {
          setImageUri(null);
          messageId = await Database.sendImageMessage(
            chatId,
            currentUser.uid,
            imageUriToSend,
            text,
            replyMessage,
            (uploadProgress) => {
              updateMessageProgress(tempId, uploadProgress);
              setUploading(uploadProgress < 100);
            }
          );
        } else if (text) {
          messageId = await Database.sendMessage(chatId, currentUser.uid, text, replyMessage);
        } else {
          throw new Error('Cannot send empty message.');
        }

        return { tempId, messageId };
      } catch (error: any) {
        updateMessageStatus(
          tempId,
          'error',
          error instanceof Error ? error.message : 'Failed to send message'
        );
        error.tempId = tempId;
        throw error;
      }
    },
    onSuccess: (data) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === data.tempId
            ? { ...msg, id: data.messageId, status: 'sent', uploadProgress: 100 }
            : msg
        )
      );

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (currentUser && chatId) {
        Database.resetTypingStatus(currentUser.uid, chatId);
      }

      setReplyMessage(null);
      setProgress(0);
      setUploading(false);
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      if (error.tempId) {
        updateMessageStatus(
          error.tempId,
          'error',
          error instanceof Error ? error.message : 'Failed to send message'
        );
      }
    },
  });

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputText.trim();
    if ((!trimmedInput && !imageUri && !file) || !currentUser || !chatId) {
      setError(
        !currentUser || !chatId ? 'Missing user or chat information' : 'Cannot send empty message'
      );
      return;
    }

    try {
      const optimisticMessage = createOptimisticMessage(trimmedInput);
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
      setInputText('');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      Database.resetTypingStatus(currentUser.uid, chatId);

      sendMessageMutate({
        text: trimmedInput,
        imageUriToSend: imageUri,
        fileToSend: file,
        tempId: optimisticMessage.id,
      });
    } catch (error) {
      console.error('Error preparing message:', error);
      setError(error instanceof Error ? error.message : 'Failed to prepare message');
    }
  }, [
    inputText,
    imageUri,
    file,
    currentUser,
    chatId,
    createOptimisticMessage,
    sendMessageMutate,
    setMessages,
  ]);

  const retryMessage = useCallback(
    (failedMessage: FirebaseMessage) => {
      setError(null);
      resetMutation();
      updateMessageStatus(failedMessage.tempId, 'pending');
      sendMessageMutate({
        text: failedMessage.content,
        imageUriToSend: failedMessage.imageUrl,
        fileToSend: failedMessage.fileUrl
          ? {
              uri: failedMessage.fileUrl,
              type: failedMessage.fileType || '',
              name: failedMessage.fileName || '',
            }
          : null,
        tempId: failedMessage.tempId,
      });
    },
    [sendMessageMutate, updateMessageStatus, resetMutation]
  );

  return {
    inputText,
    setInputText: handleInputChange,
    replyMessage,
    setReplyMessage,
    isSendingMessage,
    sendMessageError:
      error || (sendMessageError instanceof Error ? sendMessageError.message : null),
    handleSendMessage,
    retryMessage,
    progress,
    uploading,
    clearError: () => setError(null),
  };
}
