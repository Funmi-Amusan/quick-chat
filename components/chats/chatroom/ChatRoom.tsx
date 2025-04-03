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
  onDisconnect,
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

  // Update user presence and set up disconnect handler
  useEffect(() => {
    if (!currentUser || !chatId) return;

    const db = getDatabase();
    const userStatusRef = ref(db, `userStatus/${currentUser.uid}`);
    const userChatStatusRef = ref(db, `chats/${chatId}/participants/${currentUser.uid}`);

    // Set user as active in this chat
    const updateStatus = {
      isActive: true,
      lastActive: serverTimestamp(),
    };

    update(userStatusRef, updateStatus);
    update(userChatStatusRef, updateStatus);

    // Set up disconnect handler
    onDisconnect(userStatusRef).update({
      isActive: false,
      lastActive: serverTimestamp(),
    });

    onDisconnect(userChatStatusRef).update({
      isActive: false,
      lastActive: serverTimestamp(),
    });

    return () => {
      // Update status when component unmounts
      update(userStatusRef, {
        isActive: false,
        lastActive: serverTimestamp(),
      });
      update(userChatStatusRef, {
        isActive: false,
        lastActive: serverTimestamp(),
      });
    };
  }, [currentUser, chatId]);

  // Handle typing indicator
  useEffect(() => {
    if (!currentUser || !chatId || inputText === '') return;

    const db = getDatabase();
    const typingRef = ref(db, `chats/${chatId}/participants/${currentUser.uid}/isTyping`);

    // Set typing status to true
    if (!isTyping) {
      setIsTyping(true);
      update(typingRef, { isTyping: true });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to turn off typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      update(typingRef, { isTyping: false });
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputText, currentUser, chatId, isTyping]);

  // Mark messages as read when they're displayed
  useEffect(() => {
    if (!currentUser || !chatId || !messages.length) return;

    const db = getDatabase();
    const unreadMessages = messages.filter((msg) => msg.senderId !== currentUser.uid && !msg.read);

    if (unreadMessages.length) {
      const updates: Record<string, boolean> = {};

      unreadMessages.forEach((msg) => {
        updates[`chats/${chatId}/messages/${msg.id}/read`] = true;
      });

      update(ref(db), updates);
    }
  }, [messages, currentUser, chatId]);

  // Get chat partner info and listen for status changes
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
            // Set up listener for partner status
            const partnerStatusRef = ref(db, `chats/${chatId}/participants/${partnerId}`);
            const unsubscribe = onValue(partnerStatusRef, (statusSnapshot) => {
              const statusData = statusSnapshot.val() || {};

              const userRef = ref(db, `users/${partnerId}`);
              get(userRef).then((userSnapshot) => {
                if (userSnapshot && userSnapshot.exists()) {
                  const userData = userSnapshot.val();
                  setChatPartner({
                    id: partnerId,
                    username: userData.username,
                    isActive: statusData.isActive || false,
                    isTyping: statusData.isTyping || false,
                    lastActive: statusData.lastActive || null,
                  });
                } else {
                  setChatPartner({
                    id: 'unknown',
                    username: 'Unknown User',
                    isActive: false,
                    isTyping: false,
                    lastActive: null,
                  });
                }
                setLoading(false);
              });
            });

            return () => unsubscribe();
          } else {
            throw new Error('Chat partner not found in participants.');
          }
        } else {
          throw new Error('Chat metadata not found.');
        }
      })
      .catch((err: any) => {
        console.error('Error fetching chat/partner info:', err);
        setError(err.message || 'Failed to load chat details.');
        setLoading(false);
      });
  }, [chatId, currentUser]);

  // Listen for messages
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
              read: value.read || false,
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
      read: false, // Initialize as unread
    };

    try {
      // Reset typing indicator
      setIsTyping(false);
      const typingRef = ref(db, `chats/${chatId}/participants/${currentUser.uid}/isTyping`);
      update(typingRef, { isTyping: false });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await push(messagesRef, newMessageData);
      const lastMessageUpdate = {
        lastMessage: {
          content: trimmedText,
          timestamp: serverTimestamp(),
          senderId: currentUser.uid,
        },
      };
      // clear chat immediately after sending
      setInputText('');
      await update(chatMetaRef, lastMessageUpdate);
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

  // Format timestamp to show last active time
  const formatLastActive = (timestamp: number | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
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

  console.log('messages', messages);

  return (
    <ChatRoomLayout>
      <View className="flex-1 bg-white">
        <View className="border-b border-gray-300 px-4 py-2">
          <View className="flex-row items-center gap-2">
            <Image source={ImageAssets.avatar} className="h-10 w-10 rounded-full" />
            <View>
              <Text className="text-lg font-semibold">{chatPartner?.username}</Text>
              <View className="flex-row items-center">
                {chatPartner.isActive ? (
                  <>
                    <View className="mr-1 h-2 w-2 rounded-full bg-green-500" />
                    <Text className="text-xs text-gray-500">Active now</Text>
                  </>
                ) : (
                  <Text className="text-xs text-gray-500">
                    {chatPartner.lastActive
                      ? `Last active ${formatLastActive(chatPartner.lastActive)}`
                      : 'Offline'}
                  </Text>
                )}
              </View>
            </View>
          </View>
          {chatPartner.isTyping && (
            <Text className="mt-1 text-xs italic text-gray-500">
              {chatPartner.username} is typing...
            </Text>
          )}
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
                  isFromSelf={message.senderId === currentUser?.uid}
                  isRead={message.read}
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
