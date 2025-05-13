import { useTheme } from '@react-navigation/native';
import ChatRoomLayout from 'components/layout/ChatRoomLayout';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Platform,
} from 'react-native';

import MessageList from '../components/chats/chatRoom/MessageList';
import ChatHeader from '../components/chats/chatRoom/chatHeader/ChatHeader';
import ImageMessagePreviewModal from '../components/chats/modals/ImageMessagePreviewModal';

import { ImageAssets } from '~/assets';
import ReplyPreview from '~/components/chats/chatRoom/ReplyPreview';
import ChatTextInput from '~/components/chats/chatRoom/chatTextInput/ChatTextInput';
import FilePreviewModal, { PickedFile } from '~/components/chats/modals/FilePreviewModal';
import useChatPresence from '~/hooks/useChatRoomPresence';
import useImagePicker from '~/hooks/useImagePicker';
import useListenForChatMessages from '~/hooks/useListenForMessages';
import useMarkMessagesAsRead from '~/hooks/useMarkMessagesAsRead';
import useSendMessage from '~/hooks/useSendMessage';
import useTypingStatus from '~/hooks/useTypingStatus';
import { auth } from '~/lib/firebase-config';
import { formatTimestampToDay } from '~/lib/helpers';
import { useChatPartner } from '~/lib/queries/useChatPartner';
import {
  ActualMessage,
  DateHeaderMessage,
  FirebaseMessage,
  ProcessedMessage,
  ReplyMessageInfo,
} from '~/lib/types';

const ChatRoom = () => {
  const { id: chatId } = useLocalSearchParams<{ id: string }>();
  const { dark } = useTheme();

  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [processedMessages, setProcessedMessages] = useState<ProcessedMessage[]>([]);
  const [searchString, setSearchString] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [matchingIndices, setMatchingIndices] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputFocus, setInputFocus] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  const flatListRef = useRef<FlatList<ProcessedMessage>>(null);

  const backgroundImage = dark ? ImageAssets.darkBackGround : ImageAssets.backGround;

  const {
    data: chatPartner,
    isLoading: chatPartnerLoading,
    error: chatPartnerError,
  } = useChatPartner(currentUserId, chatId);

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
  const { inputText, setInputText, replyMessage, setReplyMessage, handleSendMessage, progress } =
    useSendMessage(chatId, currentUser, setImageUri, imageUri, setFile, file, setMessages);
  useTypingStatus(currentUser, chatId, inputText);

  const handleReply = useCallback(
    (message: ReplyMessageInfo) => {
      setReplyMessage(message);
      setInputFocus(true);
    },
    [setReplyMessage]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < processedMessages.length) {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }
    },
    [processedMessages.length]
  );

  useEffect(() => {
    if (currentMatchIndex !== -1 && matchingIndices.length > 0) {
      const targetIndexInProcessed = matchingIndices[currentMatchIndex];
      scrollToIndex(targetIndexInProcessed);
    }
  }, [currentMatchIndex, matchingIndices, scrollToIndex]);

  useMemo(() => {
    if (!messages || messages.length === 0) {
      setProcessedMessages([]);
      return;
    }
    const transformedData: ProcessedMessage[] = [];
    const sortedMessages = [...messages].sort((a, b) => b.timestamp - a.timestamp);
    const messagesByDay: { [date: string]: ActualMessage[] } = {};
    sortedMessages.forEach((message) => {
      const dateKey = formatTimestampToDay(message.timestamp);
      if (!messagesByDay[dateKey]) {
        messagesByDay[dateKey] = [];
      }
      const actualMessage: ActualMessage = {
        ...message,
        type: 'message',
        id: message.id,
      };
      messagesByDay[dateKey].push(actualMessage);
    });

    Object.entries(messagesByDay).forEach(([dateStr, dayMessages], index) => {
      dayMessages.forEach((message) => {
        transformedData.push(message);
      });

      const dateHeader: DateHeaderMessage = {
        type: 'header',
        date: dateStr,
        id: `header_${dayMessages[0].timestamp}_${index}`,
      };
      transformedData.push(dateHeader);
    });

    setProcessedMessages(transformedData);
  }, [messages]);

  useMemo(() => {
    if (!searchString || searchString.trim() === '' || searchString.trim().length < 3) {
      setMatchingIndices([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const lowerSearch = searchString.toLowerCase();
    const indices: number[] = [];

    processedMessages.forEach((msg, index) => {
      if (
        msg.type === 'message' &&
        'content' in msg &&
        msg.content?.toLowerCase().includes(lowerSearch)
      ) {
        indices.push(index);
      }
    });

    setMatchingIndices(indices);
    setCurrentMatchIndex(indices.length > 0 ? 0 : -1);
    if (indices.length > 0) {
      scrollToIndex(indices[0]);
    }
  }, [searchString, processedMessages, scrollToIndex]);

  useEffect(() => {
    setBackgroundLoaded(false);

    if (Platform.OS !== 'web') {
      const imageSource = Image.resolveAssetSource(backgroundImage);
      if (imageSource && imageSource.uri) {
        Image.prefetch(imageSource.uri)
          .then(() => setBackgroundLoaded(true))
          .catch((err) => console.error('Failed to preload background image:', err));
      } else {
        setBackgroundLoaded(true);
      }
    } else {
      setBackgroundLoaded(true);
    }
  }, [dark, backgroundImage]);

  return (
    <ChatRoomLayout>
      <ChatHeader
        chatPartner={chatPartner}
        setSearchString={setSearchString}
        searchString={searchString}
        isLoading={chatPartnerLoading}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <ImageBackground
            source={backgroundImage}
            resizeMode="cover"
            style={styles.backgroundImage}
            onLoadEnd={() => setBackgroundLoaded(true)}>
            {loading ? (
              <View
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 8, color: dark ? '#a0a0a0' : '#666666' }}>
                  Loading chat...
                </Text>
              </View>
            ) : error ? (
              <View
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <Text style={{ marginTop: 8, textAlign: 'center', color: '#ef4444' }}>{error}</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {loadingOlder && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                      paddingVertical: 4,
                    }}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={{ marginLeft: 8, color: dark ? '#d1d1d1' : '#333333' }}>
                      Loading older messages...
                    </Text>
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
                  flatListRef={flatListRef}
                  highlightedIndex={matchingIndices[currentMatchIndex]}
                />
              </View>
            )}
          </ImageBackground>
        </View>
        <View style={{ backgroundColor: dark ? '#1e1e1e' : '#f0f0f0' }}>
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
            onFilePicked={(e) => {
              setFile(e);
            }}
          />
        </View>
      </KeyboardAvoidingView>
      <ImageMessagePreviewModal
        setImageUri={setImageUri}
        imageUri={imageUri}
        setInputText={setInputText}
        inputText={inputText}
        handleSendMessage={handleSendMessage}
      />
      <FilePreviewModal
        file={file}
        onClose={() => setFile(null)}
        setInputText={(e) => setInputText(e)}
        inputText={inputText}
        handleSendMessage={handleSendMessage}
        progress={progress}
      />
    </ChatRoomLayout>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
});

export default ChatRoom;
