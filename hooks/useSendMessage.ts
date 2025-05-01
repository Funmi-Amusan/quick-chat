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

  console.log('error----', error)

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

  const handleUploadProgress = useCallback(
    (progress: number) => {
      setUploading(true);
      setProgress(Math.max(0, Math.min(100, progress)));
      if (lastSentTimestampRef.current) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.tempId === lastSentTimestampRef.current?.toString()
              ? { ...msg, uploadProgress: progress, status: progress < 100 ? 'uploading' : 'sent' }
              : msg
          )
        );
      }

      // When upload completes
      if (progress >= 100) {
        setTimeout(() => setUploading(false), 500); // Give UI time to show 100% before resetting
      }
    },
    [setMessages]
  );

  /**
   * Creates an optimistic message object
   */
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
    [chatId, currentUser, file, imageUri, replyMessage]
  );

  const updateMessageStatus = useCallback(
    (tempId: string, status: 'pending' | 'sent' | 'error', errorMessage?: string) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.tempId === tempId ? { ...msg, status, errorMessage } : msg))
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

        // Auto-reset after 5 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          Database.resetTypingStatus(currentUser.uid, chatId);
          typingTimeoutRef.current = null;
        }, 5000);
      } else {
        // Reset immediately if text is cleared
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
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.tempId === tempId ? { ...msg, status: 'pending', uploadProgress } : msg
                )
              );
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
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg.tempId === tempId ? { ...msg, status: 'pending', uploadProgress } : msg
                )
              );
            }
          );
        } else if (text) {
          await Database.sendMessage(chatId, currentUser.uid, text, replyMessage);
        } else {
          throw new Error('Cannot send empty message.');
        }

        if (messageId) {
          setMessages((prevMessages) => 
            prevMessages.map((msg) =>
              msg.id === tempId
                ? { ...msg, id: messageId, status: 'sent', uploadProgress: 100 }
                : msg
            )
          );
        }

        return messageId;
      } catch (error) {
        // Update the optimistic message with error status
        updateMessageStatus(
          tempId,
          'error',
          error instanceof Error ? error.message : 'Failed to send message'
        );
        throw error;
      }
    },
    onSuccess: () => {
      // Reset states after successful send
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

      // Keep the input text if sending failed
      setInputText((prevText) => prevText || params.text);
    },
  });

  /**
   * Handle message sending with retry capability
   */
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputText.trim();

    // Validate required data
    if ((!trimmedInput && !imageUri && !file) || !currentUser || !chatId) {
      setError(
        !currentUser || !chatId ? 'Missing user or chat information' : 'Cannot send empty message'
      );
      return;
    }

    try {
      // Create optimistic message
      const optimisticMessage = createOptimisticMessage(trimmedInput);
      setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

      // Clear input field
      setInputText('');

      // Reset typing status
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      Database.resetTypingStatus(currentUser.uid, chatId);

      // Send the actual message
      sendMessageMutate({
        text: trimmedInput,
        imageUriToSend: imageUri,
        fileToSend: file,
        tempId: optimisticMessage.tempId,
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
      // Reset error state first
      setError(null);
      resetMutation();

      // Update message status back to pending
      updateMessageStatus(failedMessage.tempId, 'pending');

      // Retry the send operation
      sendMessageMutate({
        text: failedMessage.content,
        imageUriToSend: failedMessage.imageUrl,
        fileToSend: failedMessage.fileUri
          ? {
              uri: failedMessage.fileUri,
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
