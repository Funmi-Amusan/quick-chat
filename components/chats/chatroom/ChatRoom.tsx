import { ImageAssets } from 'assets';
import ChatRoomLayout from 'components/layout/ChatRoomLayout';
import { useLocalSearchParams } from 'expo-router';
import {
  getDatabase,
  ref,
  onValue,
  query,
  orderByChild,
  get,
  push,
  serverTimestamp,
  update,
} from 'firebase/database';
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

import MessageBubble from '../messageBubble/MessageBubble';
import ChatTextInput from '../textInput/TextInput';

import { auth } from '~/lib/firebase-config';
interface FirebaseMessage {
  id: string;
  content: string;
  senderId: string;
}

interface ChatPartner {
  id: string;
  username: string;
}

const ChatRoom = () => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');

  const currentUser = auth.currentUser;
  const scrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!chatId || !currentUser) {
      setError('Chat ID or user missing.');
      setLoading(false);
      return;
    }
    const db = getDatabase();
    const chatMetaRef = ref(db, `chats/${chatId}`);

    get(chatMetaRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const chatData = snapshot.val();
          const participantIds = Object.keys(chatData.participants || {});
          const partnerId = participantIds.find((pId) => pId !== currentUser.uid);

          if (partnerId) {
            const userRef = ref(db, `users/${partnerId}`);
            return get(userRef);
          } else {
            throw new Error('Chat partner not found in participants.');
          }
        } else {
          throw new Error('Chat metadata not found.');
        }
      })
      .then((userSnapshot) => {
        if (userSnapshot && userSnapshot.exists()) {
          const userData = userSnapshot.val();
          setChatPartner({
            id: userSnapshot.key!,
            username: userData.username,
          });
        } else {
          setChatPartner({
            id: 'unknown',
            username: 'Unknown User',
          });
          console.warn(`User data for partner ${chatPartner?.id} not found.`);
        }
      })
      .catch((err: any) => {
        console.error('Error fetching chat/partner info:', err);
        setError(err.message || 'Failed to load chat details.');
      });
  }, [chatId, currentUser]);
  useEffect(() => {
    if (!chatId) {
      setError('Chat ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const db = getDatabase();
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    const unsubscribe = onValue(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.val();
        if (messagesData) {
          const messagesList: FirebaseMessage[] = Object.entries(messagesData).map(
            ([key, value]: [string, any]) => ({
              id: key,
              content: value.content,
              senderId: value.senderId,
              timestamp: value.timestamp,
              // add delivery status later
            })
          );
          setMessages(messagesList);
        } else {
          setMessages([]);
        }
        setLoading(false);
      },
      (err: any) => {
        console.error('Error listening to messages:', err);
        setError(err.message || 'Failed to load messages.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [chatId]);
  const handleSendMessage = useCallback(async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || !currentUser || !chatId) {
      return;
    }

    const db = getDatabase();
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const chatMetaRef = ref(db, `chats/${chatId}`);

    const newMessageData = {
      content: trimmedText,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
    };

    try {
      await push(messagesRef, newMessageData);
      const lastMessageUpdate = {
        lastMessage: {
          content: trimmedText,
          timestamp: serverTimestamp(),
          senderId: currentUser.uid,
        },
      };
      // clear chat immediately after sending. use delivery status to show if message is delivered later
      setInputText('');
      await update(chatMetaRef, lastMessageUpdate);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message.');
    }
  }, [inputText, currentUser, chatId]);
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
          <Text className=" text-center text-red-600">Error: {error}</Text>
        </View>
      </ChatRoomLayout>
    );
  }

  if (loading || !chatPartner) {
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
      <View className=" flex-1 bg-white">
        <View className=" flex-row items-center gap-2 border-b-gray-300 px-4 py-2 ">
          <Image source={ImageAssets.avatar} className="h-10 w-10 rounded-full" />
          <Text className=" text-lg font-semibold ">{chatPartner?.username}</Text>
        </View>
        <KeyboardAvoidingView
          className=" flex-1 "
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <ScrollView
            ref={scrollViewRef}
            className=" flex-grow px-2"
            contentContainerStyle={{
              paddingVertical: 10,
              gap: 10,
            }}
            onContentSizeChange={handleContentSizeChange}>
            {messages.map((message) => (
              <View key={message.id}>
                <MessageBubble
                  content={message.content}
                  isFromSelf={message.senderId === currentUser?.uid}
                />
              </View>
            ))}
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
