import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import ChatRoomLayout from 'components/layout/ChatRoomLayout';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Animated from 'react-native-reanimated';

import MessageList from './MessageList';
import ReplyPreview from './ReplyPreview';
import ChatTextInput from '../textInput/TextInput';
import ChatHeader from './chatHeader/ChatHeader';

import ImageMessagePreviewModal from '~/components/modals/ImageMessagePreviewModal';
import useChatPresence from '~/hooks/useChatRoomPresence';
import useImagePicker from '~/hooks/useImagePicker';
import useListenForChatMessages from '~/hooks/useListenForMessages';
import useMarkMessagesAsRead from '~/hooks/useMarkMessagesAsRead';
import useSendMessage from '~/hooks/useSendMessage';
import useTypingStatus from '~/hooks/useTypingStatus';
import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';
import { formatTimestamp, isSameDay } from '~/lib/helpers';
import {
  ActualMessage,
  ChatPartner,
  DateHeaderMessage,
  FirebaseMessage,
  ProcessedMessage,
  ReplyMessageInfo,
} from '~/lib/types';

const ChatRoom = () => {
  const { dark } = useTheme();
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [processedMessages, setProcessedMessages] = useState<ProcessedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputFocus, setInputFocus] = useState(false);
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  const swipeableRowRef = useRef<Animated.View>(null);

  const {
    data: chatPartner,
    isLoading: chatPartnerLoading,
    error: chatPartnerError,
  } = useQuery<ChatPartner, Error>({
    queryKey: ['chatPartner', chatId, currentUserId],
    queryFn: async () => {
      if (!chatId || !currentUserId) {
        router.back();
        throw new Error('Chat ID or User ID is missing.');
      }
      const partnerInfo = await Database.fetchChatPartnerInfo(chatId, currentUserId);
      if (!partnerInfo) {
        router.back();
        throw new Error('Chat partner not found.');
      }
      return partnerInfo;
    },
    enabled: !!chatId && !!currentUserId,
    staleTime: Infinity,
    refetchInterval: 1000 * 60 * 12,
  });

  useChatPresence(currentUser, chatId);
  useMarkMessagesAsRead(currentUser, chatId, messages);
  const { hasMoreMessages, loadOlderMessages, loadingOlder } = useListenForChatMessages({
    chatId,
    currentUser,
    setMessages,
    setLoading,
    setError,
    chatPartner,
  });
  const { imageUri, setImageUri, uploading, pickImage } = useImagePicker();
  const { inputText, setInputText, replyMessage, setReplyMessage, handleSendMessage } =
    useSendMessage(chatId, currentUser, setImageUri, imageUri);
  useTypingStatus(currentUser, chatId, inputText);

  useEffect(() => {
    if (replyMessage && swipeableRowRef.current) {
      swipeableRowRef.current.close();
      swipeableRowRef.current = null;
    }
  }, [replyMessage, swipeableRowRef]);

  const handleReply = useCallback(
    (message: ReplyMessageInfo) => {
      setReplyMessage(message);
      setInputFocus(true);
    },
    [setReplyMessage]
  );

  useMemo(() => {
    if (!messages || messages.length === 0) {
      setProcessedMessages([]);
      return;
    }
    const transformedData: ProcessedMessage[] = [];
    let previousMessageTimestamp: number | null = null;
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    sortedMessages.forEach((message, index) => {
      if (index === 0 || !isSameDay(message.timestamp, previousMessageTimestamp)) {
        const dateHeader: DateHeaderMessage = {
          type: 'header',
          date: formatTimestamp(message.timestamp),
          id: `header_${message.timestamp}_${index}`,
        };
        transformedData.push(dateHeader);
      }
      const actualMessage: ActualMessage = {
        ...message,
        type: 'message',
        id: message.id,
      };
      transformedData.push(actualMessage);

      previousMessageTimestamp = message.timestamp;
    });
    setProcessedMessages(transformedData);
  }, [messages]);

  return (
    <ChatRoomLayout>
      <View className="bg-body-light dark:bg-body-dark border-b border-white/30 px-4 py-2">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity className="px-2" onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={14} color={dark ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
          <ChatHeader chatPartner={chatPartner} isLoading={chatPartnerLoading} />
        </View>
      </View>

      {loading ? (
        <View className="bg-body-light dark:bg-body-dark flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-2 text-gray-600">Loading chat...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="mt-2 text-center text-red-500">{error}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView className="relative flex-grow" behavior="padding">
          {loadingOlder && (
            <View className="bg-body-light dark:bg-body-dark absolute left-0 right-0 top-0 z-10 flex-row items-center justify-center py-2">
              <ActivityIndicator size="small" color="#007AFF" />
              <Text className="ml-2 text-gray-600">Loading older messages...</Text>
            </View>
          )}
          <MessageList
            processedMessages={processedMessages}
            currentUser={currentUser}
            chatId={chatId}
            handleReply={handleReply}
            loadOlderMessages={loadOlderMessages}
            hasMoreMessages={hasMoreMessages}
            loadingOlder={loadingOlder}
            chatPartner={chatPartner}
          />
          <View>
            {replyMessage && (
              <ReplyPreview replyMessage={replyMessage} setReplyMessage={setReplyMessage} />
            )}
            <ChatTextInput
              value={inputText}
              onChangeText={setInputText}
              onSendPress={handleSendMessage}
              placeholder="Type something..."
              setFocus={() => setInputFocus(true)}
              onFocus={() => {
                setInputFocus(true);
              }}
              onImagePress={pickImage}
              isUploading={uploading}
            />
          </View>
        </KeyboardAvoidingView>
      )}
      <ImageMessagePreviewModal
        setImageUri={(e) => setImageUri(e)}
        imageUri={imageUri}
        setInputText={(e) => setInputText(e)}
        inputText={inputText}
        handleSendMessage={handleSendMessage}
      />
    </ChatRoomLayout>
  );
};

export default ChatRoom;
