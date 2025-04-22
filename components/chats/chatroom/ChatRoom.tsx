import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ImageAssets } from 'assets';
import ChatRoomLayout from 'components/layout/ChatRoomLayout';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Animated from 'react-native-reanimated';

import ActiveTypingBubble from '../ActiveTypingBubble';
import ReplyPreview from './ReplyPreview';
import MessageBubble from '../messageBubble/MessageBubble';
import ChatTextInput from '../textInput/TextInput';
import ChatHeader from './chatHeader/ChatHeader';

import ImageMessagePreviewModal from '~/components/modals/ImageMessagePreviewModal';
import DateHeader from '~/components/ui/DateHeader';
import useChatPresence from '~/hooks/useChatRoomPresence';
import useListenForChatMessages from '~/hooks/useListenForMessages';
import useMarkMessagesAsRead from '~/hooks/useMarkMessagesAsRead';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [inputFocus, setInputFocus] = useState(false);
  const [replyMessage, setReplyMessage] = useState<ReplyMessageInfo | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
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

  useChatPresence(currentUser, chatId);
  useTypingStatus(currentUser, chatId, inputText);
  useMarkMessagesAsRead(currentUser, chatId, messages);
  const { hasMoreMessages, loadOlderMessages, loadingOlder } = useListenForChatMessages({
    chatId,
    currentUser,
    setMessages,
    setLoading,
    setError,
    chatPartner,
  });

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access media library was denied');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image');
    }
  };

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

  const keyExtractor = useCallback((item: ProcessedMessage) => item.id, []);

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

  const renderMessage = useCallback(
    ({ item }: { item: FirebaseMessage }) => (
      <View className="my-1">
        <MessageBubble
          onReply={(replyInfo) => handleReply(replyInfo)}
          chatId={chatId}
          isFromSelf={item.senderId === currentUser?.uid}
          {...item}
          updateRef={swipeableRowRef}
        />
      </View>
    ),
    [currentUser?.uid]
  );

  const renderItem = ({ item }: { item: ProcessedMessage }) => {
    if (item.type === 'header') {
      return <DateHeader date={item.date} />;
    } else if (item.type === 'message') {
      return renderMessage({ item: item as ActualMessage });
    }
    return null;
  };

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
          <Animated.FlatList
            ref={flatListRef}
            className="bg-body-light dark:bg-body-dark flex-1"
            contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 8 }}
            data={processedMessages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListFooterComponent={chatPartner?.isTyping.isTyping ? <ActiveTypingBubble /> : null}
            onStartReached={() => {
              if (hasMoreMessages) {
                loadOlderMessages();
              }
            }}
            onStartReachedThreshold={0.3}
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
