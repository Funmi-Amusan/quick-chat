import { ImageAssets } from 'assets';
import ChatRoomLayout from 'components/layout/ChatRoomLayout';
import { useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import ActiveTypingBubble from '../ActiveTypingBubble';
import MessageBubble from '../messageBubble/MessageBubble';
import ChatTextInput from '../textInput/TextInput';

import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';
import { formatMomentAgo } from '~/lib/helpers';

interface FirebaseMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  read: boolean;
}

interface ChatPartner {
  id: string;
  username: string;
  isActive: boolean;
  isTyping: boolean;
  lastActive: number | null;
}

const ChatRoom = () => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUser = auth.currentUser;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!currentUser || !chatId) return;
    Database.updateUserPresence(currentUser.uid, chatId, true);
    Database.setupPresenceDisconnectHandlers(currentUser.uid, chatId);
    return () => {
      Database.updateUserPresence(currentUser.uid, chatId, false);
    };
  }, [currentUser, chatId]);

  useEffect(() => {
    if (!currentUser || !chatId || inputText === '') return;
    if (!isTyping) {
      setIsTyping(true);
      Database.setTypingStatus(currentUser.uid, chatId, true);
    }
  }, [inputText, currentUser, chatId, isTyping]);

  useEffect(() => {
    if (!currentUser || !chatId || !messages.length) return;
    Database.markMessagesAsRead(chatId, currentUser.uid, messages);
  }, [messages, currentUser, chatId]);

  useEffect(() => {
    if (!chatId || !currentUser) {
      setError('Chat ID or user missing.');
      setLoading(false);
      return;
    }
    const unsubscribe = Database.fetchChatPartnerInfo(
      chatId,
      currentUser.uid,
      setChatPartner,
      setLoading,
      setError
    );
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    if (!chatId) {
      setError('Chat ID is missing.');
      setLoading(false);
      return;
    }
    const unsubscribe = Database.listenForMessages(chatId, setMessages, setLoading, setError);
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || !currentUser || !chatId) {
      return;
    }
    try {
      setIsTyping(false);
      Database.resetTypingStatus(currentUser.uid, chatId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      await Database.sendMessage(chatId, currentUser.uid, inputText);
      setInputText('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  }, [inputText, currentUser, chatId, isTyping]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleContentSizeChange = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false });
    }
  };

  if (error) {
    return (
      <ChatRoomLayout>
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-red-600">Error: {error}</Text>
        </View>
      </ChatRoomLayout>
    );
  }

  if (loading) {
    return (
      <ChatRoomLayout>
        <View className="flex-1 items-center justify-center p-4">
          <ActivityIndicator size="large" />
          <Text>Loading Chat...</Text>
        </View>
      </ChatRoomLayout>
    );
  }

  return (
    <ChatRoomLayout>
      <View className="flex-1 bg-white">
        <View className="border-b border-gray-300 px-4 py-2">
          <View className="flex-row items-center gap-2">
            <Image source={ImageAssets.avatar} className="h-10 w-10 rounded-full" />
            <View>
              <Text className="text-lg font-semibold">{chatPartner?.username}</Text>
              <View className="flex-row items-center">
                {chatPartner?.isActive ? (
                  <>
                    <View className="mr-1 h-2 w-2 rounded-full bg-green-500" />
                    <Text className="text-xs text-gray-500">Active now</Text>
                  </>
                ) : (
                  <Text className="text-xs text-gray-500">
                    {chatPartner?.lastActive
                      ? `Last active ${formatMomentAgo(chatPartner?.lastActive)}`
                      : 'Offline'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <ScrollView
            ref={scrollViewRef}
            className="flex-grow px-2"
            contentContainerStyle={{
              paddingVertical: 10,
              gap: 10,
            }}
            onContentSizeChange={handleContentSizeChange}>
            {messages.map((message) => (
              <View key={message.id}>
                <MessageBubble
                  content={message.content}
                  isFromSelf={message.senderId == currentUser?.uid}
                  isRead={message.read}
                />
              </View>
            ))}
            {chatPartner?.isTyping && <ActiveTypingBubble />}
          </ScrollView>
          <ChatTextInput
            value={inputText}
            onChangeText={setInputText}
            onSendPress={handleSendMessage}
            placeholder="Message..."
          />
        </KeyboardAvoidingView>
      </View>
    </ChatRoomLayout>
  );
};

export default ChatRoom;
