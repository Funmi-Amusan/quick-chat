import { User } from 'firebase/auth';
import React, { useCallback, useRef } from 'react';
import { View, Text, FlatList } from 'react-native';
import Animated from 'react-native-reanimated';

import ActiveTypingBubble from '../ActiveTypingBubble';
import MessageBubble from '../messageBubble/MessageBubble';

import DateHeader from '~/components/ui/DateHeader';
import {
  ActualMessage,
  ChatPartner,
  FirebaseMessage,
  ProcessedMessage,
  ReplyMessageInfo,
} from '~/lib/types';

const MessageList = ({
  processedMessages,
  currentUser,
  chatId,
  handleReply,
  loadOlderMessages,
  hasMoreMessages,
  loadingOlder,
  chatPartner,
}: {
  processedMessages: ProcessedMessage[];
  currentUser: User | null;
  chatId: string;
  handleReply: (arg0: ReplyMessageInfo) => void;
  loadOlderMessages: () => void;
  hasMoreMessages: boolean;
  loadingOlder: boolean;
  chatPartner?: ChatPartner;
}) => {
  const flatListRef = useRef<FlatList>(null);

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

  const keyExtractor = useCallback((item: ProcessedMessage) => item.id, []);

  return (
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
  );
};

export default MessageList;
