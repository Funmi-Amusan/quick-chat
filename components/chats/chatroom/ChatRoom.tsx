import FontAwesome from '@expo/vector-icons/FontAwesome';
// import { FlashList } from '@shopify/flash-list'; // use flash list later or legend list
import { ImageAssets } from 'assets';
import ChatRoomLayout from 'components/layout/ChatRoomLayout';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  KeyboardAvoidingView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';

import ActiveTypingBubble from '../ActiveTypingBubble';
import MessageBubble from '../messageBubble/MessageBubble';
import ChatTextInput from '../textInput/TextInput';

import useChatPresence from '~/hooks/useChatRoomPresence';
import useFetchChatPartner from '~/hooks/useFetchChatPartnerInfo';
import useListenForChatMessages from '~/hooks/useListenForMessages';
import useMarkMessagesAsRead from '~/hooks/useMarkMessagesAsRead';
import useTypingStatus from '~/hooks/useTypingStatus';
import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';
import { formatMomentAgo } from '~/lib/helpers';
import { ChatPartner, FirebaseMessage } from '~/lib/types';
import ChatHeader from './chatHeader/ChatHeader';

const ChatRoom = () => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;

  useChatPresence(currentUser, chatId);
  useTypingStatus(currentUser, chatId, inputText);
  useMarkMessagesAsRead(currentUser, chatId, messages);
  useFetchChatPartner(chatId, currentUser, setChatPartner, setLoading, setError);
  useListenForChatMessages({
    chatId,
    currentUser,
    setMessages,
    setLoading,
    setError,
    chatPartner,
  });

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  }, []);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (chatPartner?.isTyping.isTyping) {
      scrollToBottom();
    }
  }, [chatPartner?.isTyping.isTyping, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || !currentUser || !chatId) {
      return;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    Database.resetTypingStatus(currentUser.uid, chatId);
    const messageToSend = trimmedInput;
    setInputText('');
    try {
      await Database.sendMessage(chatId, currentUser.uid, messageToSend);
      scrollToBottom();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  }, [inputText, currentUser, chatId, scrollToBottom]);

  const renderMessage = useCallback(
    ({ item }: { item: FirebaseMessage }) => (
      <View className="my-1">
        <MessageBubble chatId={chatId} isFromSelf={item.senderId === currentUser?.uid} {...item} />
      </View>
    ),
    [currentUser?.uid]
  );

  const keyExtractor = useCallback((item: FirebaseMessage) => item.id, []);

  return (
    <ChatRoomLayout>
      <View className=" border-b border-gray-300 bg-white px-4 py-2">
        <View className="flex-row items-center">
          <TouchableOpacity className="px-2" onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={14} color="#000" />
          </TouchableOpacity>
          <ChatHeader chatPartner={chatPartner} />
        </View>
      </View>

      {loading && !messages.length ? (
        <View className="flex-1 items-center justify-center bg-slate-200 p-4">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-2 text-gray-600">Loading chat...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="mt-2 text-center text-red-500">{error}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView className="relative flex-grow" behavior="padding">
          <FlatList
            ref={flatListRef}
            className="flex-1 bg-slate-100"
            contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 8 }}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            ListFooterComponent={chatPartner?.isTyping.isTyping ? <ActiveTypingBubble /> : null}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
          <ChatTextInput
            value={inputText}
            onChangeText={setInputText}
            onSendPress={handleSendMessage}
            placeholder="Type something..."
          />
        </KeyboardAvoidingView>
      )}
    </ChatRoomLayout>
  );
};

export default ChatRoom;
