import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
// import { FlashList } from '@shopify/flash-list'; // use flash list later or legend list
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import Animated from 'react-native-reanimated';

import ActiveTypingBubble from '../ActiveTypingBubble';
import MessageBubble from '../messageBubble/MessageBubble';
import ChatTextInput from '../textInput/TextInput';
import ChatHeader from './chatHeader/ChatHeader';

import useChatPresence from '~/hooks/useChatRoomPresence';
import useFetchChatPartner from '~/hooks/useFetchChatPartnerInfo';
import useListenForChatMessages from '~/hooks/useListenForMessages';
import useMarkMessagesAsRead from '~/hooks/useMarkMessagesAsRead';
import useTypingStatus from '~/hooks/useTypingStatus';
import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';
import { ChatPartner, FirebaseMessage, ReplyMessageInfo } from '~/lib/types';

const ChatRoom = () => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [inputFocus, setInputFocus] = useState(false);
  const [replyMessage, setReplyMessage] = useState<ReplyMessageInfo | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const currentUser = auth.currentUser;
  const swipeableRowRef = useRef<Animated.View>(null);

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
      await Database.sendMessage(chatId, currentUser.uid, messageToSend, replyMessage);
      setReplyMessage(null);
      scrollToBottom();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  }, [inputText, currentUser, chatId, scrollToBottom]);

  const handleInputFocus = () => {};

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
          <Animated.FlatList
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
          <View>
            {replyMessage && (
              <View className="h-12 flex-row items-center gap-2 border-l-4 border-mint bg-black/20 ">
                <Text className="line-clamp-1 flex-grow px-2 text-sm text-gray-700">
                  {replyMessage.content}
                </Text>
                <Ionicons
                  name="close-circle-outline"
                  size={24}
                  color="white"
                  className="mx-2"
                  onPress={() => setReplyMessage(null)}
                />
              </View>
            )}
            <ChatTextInput
              value={inputText}
              onChangeText={setInputText}
              onSendPress={handleSendMessage}
              placeholder="Type something..."
              setFocus={() => setInputFocus(true)}
              onFocus={handleInputFocus}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </ChatRoomLayout>
  );
};

export default ChatRoom;
