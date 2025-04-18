import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ImageAssets } from 'assets';
import ChatRoomLayout from 'components/layout/ChatRoomLayout';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
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
  Modal,
} from 'react-native';
import Animated from 'react-native-reanimated';

import ActiveTypingBubble from '../ActiveTypingBubble';
import MessageBubble from '../messageBubble/MessageBubble';
import ChatTextInput from '../textInput/TextInput';
import ChatHeader from './chatHeader/ChatHeader';

import useChatPresence from '~/hooks/useChatRoomPresence';
import useListenForChatMessages from '~/hooks/useListenForMessages';
import useMarkMessagesAsRead from '~/hooks/useMarkMessagesAsRead';
import useTypingStatus from '~/hooks/useTypingStatus';
import { auth } from '~/lib/firebase-config';
import * as Database from '~/lib/firebase-sevice';
import { ChatPartner, FirebaseMessage, ReplyMessageInfo } from '~/lib/types';

const ChatRoom = () => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [loading, setLoading] = useState(true);
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
      console.log('Chat partner info:', partnerInfo);
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
      console.log('Message sent successfully');
      setInputText('');
      setReplyMessage(null);
      setImageUri(null);
      scrollToBottom();
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
  }, [inputText, imageUri, currentUser, chatId, replyMessage, sendMessageMutate, scrollToBottom]);

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

  const handleCloseModal = () => {
    setImageUri(null);
  };

  const keyExtractor = useCallback((item: FirebaseMessage) => item.id, []);

  return (
    <ChatRoomLayout>
      <View className="border-b border-gray-300 bg-white px-4 py-2">
        <View className="flex-row items-center">
          <TouchableOpacity className="px-2" onPress={() => router.back()}>
            <FontAwesome name="chevron-left" size={14} color="#000" />
          </TouchableOpacity>
          <ChatHeader chatPartner={chatPartner} isLoading={chatPartnerLoading} />
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
                <View className="flex-grow flex-row items-start gap-2 px-2">
                  {replyMessage.imageUrl && (
                    <MaterialCommunityIcons name="camera" size={20} color="grey" />
                  )}
                  <Text className="text-grey-700 line-clamp-1 text-sm">
                    {replyMessage.content
                      ? replyMessage.content
                      : replyMessage.imageUrl
                        ? 'Photo'
                        : ''}
                  </Text>
                </View>
                <View className=" my-1 flex-row items-center justify-center">
                  <Image
                    source={{ uri: replyMessage.imageUrl || '' }}
                    className="aspect-square h-full rounded-md"
                    resizeMode="cover"
                  />
                  <Ionicons
                    name="close-circle-outline"
                    size={24}
                    color="white"
                    className="mx-2"
                    onPress={() => setReplyMessage(null)}
                  />
                </View>
              </View>
            )}
            <ChatTextInput
              value={inputText}
              onChangeText={setInputText}
              onSendPress={handleSendMessage}
              placeholder="Type something..."
              setFocus={() => setInputFocus(true)}
              onFocus={() => {
                console.log('Input focused');
                setInputFocus(true);
              }}
              onImagePress={pickImage}
              isUploading={uploading}
            />
          </View>
        </KeyboardAvoidingView>
      )}
      <Modal
        animationType="fade"
        transparent
        visible={imageUri !== null}
        onRequestClose={handleCloseModal}>
        <View className=" h-full w-full bg-transparent">
          <BlurView
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            }}
            tint="dark"
            intensity={90}
          />

          <TouchableOpacity className="absolute left-10 top-12 z-20" onPress={handleCloseModal}>
            <AntDesign name="closecircle" size={36} color="grey" />
          </TouchableOpacity>

          <KeyboardAvoidingView
            behavior="padding"
            className="absolute bottom-10 left-0 right-0 z-10 flex-row items-center justify-between">
            <ChatTextInput
              value={inputText}
              onChangeText={(e) => setInputText(e)}
              onSendPress={handleSendMessage}
              placeholder="Add a caption..."
              showCameraIcon={false}
            />
          </KeyboardAvoidingView>

          <Image source={{ uri: imageUri || '' }} className="h-full w-full" resizeMode="contain" />
        </View>
      </Modal>
    </ChatRoomLayout>
  );
};

export default ChatRoom;
